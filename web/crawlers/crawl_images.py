import os
import re
import time
import requests
import mysql.connector
from PIL import Image
from io import BytesIO
from selenium import webdriver
from selenium.webdriver.common.by import By
import random


# === Cấu hình ===
start_url = 'https://truyenqqgo.com/truyen-tranh/i-thought-she-was-a-yandere-but-apparently-shes-even-worse-fan-colored-17622-chap-6.html'
comic_slug = 'i-thought-she-was-a-yandere-but-apparently-shes-even-worse-fan-colored'

# === Kết nối database ===
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="db_truyenz"
)
cursor = db.cursor(buffered=True)

# === Phân tích chương hiện tại từ URL ===
match = re.search(r'-chap-(\d+)\.html', start_url)
if not match:
    print(" Không nhận diện được số chương trong URL")
    exit()
current_chapter = int(match.group(1))

# === Khởi tạo trình duyệt ===
driver = webdriver.Chrome()

# === Lấy ID truyện ===
cursor.execute("SELECT id FROM comics WHERE slug = %s", (comic_slug,))
comic = cursor.fetchone()
if not comic:
    print(" Không tìm thấy truyện với slug:", comic_slug)
    driver.quit()
    exit()
comic_id = comic[0]

# === Vòng lặp tải chương từ current_chapter về 1 ===
for chapter_number in range(current_chapter, 0, -1):
    print(f"\n Đang xử lý chương {chapter_number}...")

    chapter_url = re.sub(r'-chap-\d+\.html', f'-chap-{chapter_number}.html', start_url)
    driver.get(chapter_url)
    time.sleep(random.uniform(2.5, 4.0))

    # Lấy ID chương
    cursor.execute("SELECT id FROM chapters WHERE comic_id = %s AND chapter_number = %s", (comic_id, chapter_number))
    chapter = cursor.fetchone()
    if not chapter:
        print(f" Không tìm thấy chương {chapter_number} trong database")
        continue
    chapter_id = chapter[0]

    # Tìm ảnh trong chapter
    images = driver.find_elements(By.CSS_SELECTOR, '.chapter_content img')
    # Lưu vào story-service/public/images với cấu trúc {slug}/{chapterNumber}
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    folder_path = os.path.join(base_dir, 'services', 'story-service', 'public', 'images', comic_slug, str(chapter_number))
    os.makedirs(folder_path, exist_ok=True)

    headers = {
        'User-Agent': 'Mozilla/5.0',
        'Referer': chapter_url
    }
    session = requests.Session()

    for idx, img in enumerate(images):
        src = img.get_attribute('src')
        if not src or "banner" in src or "quangcao" in src:
            continue

        try:
            response = session.get(src, headers=headers)
            img_data = Image.open(BytesIO(response.content))
            width, height = img_data.size
            if abs(width - height) < 10:
                print(f" Bỏ qua ảnh vuông: {src}")
                continue

            filename = f'{idx+1:03}.jpg'
            file_path = os.path.join(folder_path, filename)
            # URL path để khớp với story-service: /public/images/{slug}/{chapterNumber}/{filename}
            relative_path = f'/public/images/{comic_slug}/{chapter_number}/{filename}'

            with open(file_path, 'wb') as f:
                f.write(response.content)
                print(f' Đã lưu: {file_path}')

            # Lưu thông tin ảnh vào database
            cursor.execute(
                "INSERT INTO chapter_images (chapter_id, image_url, page_number) VALUES (%s, %s, %s)",
                (chapter_id, relative_path, idx + 1)
            )

        except Exception as e:
            print(f' Lỗi ảnh: {src} - {str(e)}')
            continue

    db.commit()
    print(f" Hoàn tất chương {chapter_number}")

# Kết thúc
cursor.close()
db.close()
driver.quit()
print("🎉 Đã tải xong tất cả chương!")
