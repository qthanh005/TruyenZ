import requests
from bs4 import BeautifulSoup
import os
import re
import unicodedata
import time
import random
import pymysql
from urllib.parse import urljoin
from typing import List, Dict, Optional
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from datetime import datetime, timedelta

# Cấu hình database
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'db_truyenz',
    'charset': 'utf8mb4'
}

def get_db_connection():
    return pymysql.connect(**DB_CONFIG)

def slugify(text):
    text = unicodedata.normalize('NFKD', text)
    text = text.encode('ascii', 'ignore').decode('utf-8')
    text = re.sub(r'[^\w\s-]', '', text).strip().lower()
    return re.sub(r'[-\s]+', '-', text)

def download_image(image_url, save_dir, filename=None):
    os.makedirs(save_dir, exist_ok=True)
    
    if filename is None:
        filename = image_url.split("/")[-1].split("?")[0]
    
    save_path = os.path.join(save_dir, filename)
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Referer": "https://truyenqqgo.com/"
    }
    
    try:
        time.sleep(random.uniform(2, 3))  # Tăng thời gian delay giữa các yêu cầu
        response = requests.get(image_url, headers=headers, stream=True, timeout=10)
        
        if response.status_code == 200:
            with open(save_path, "wb") as f:
                for chunk in response.iter_content(1024):
                    f.write(chunk)
            return save_path
    except Exception as e:
        print(f"Lỗi khi tải ảnh: {e}")
    return None

def get_info_by_icon(soup, icon_class):
    items = soup.select("ul.list-info li.row")
    for item in items:
        icon = item.select_one("i")
        if icon and icon_class in icon["class"]:
            value_tag = item.select_one("p.col-xs-9")
            if value_tag:
                return value_tag.text.strip()
    return "Đang cập nhật"

def crawl_comic_chapters(comic_url: str, comic_id: int) -> List[Dict]:
    session = requests.Session()
    retries = Retry(total=5, backoff_factor=0.3, status_forcelist=[429, 500, 502, 503, 504])
    session.mount('https://', HTTPAdapter(max_retries=retries))
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    try:
        response = session.get(comic_url, headers=headers)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Lỗi khi truy cập URL truyện: {e}")
        return []

    soup = BeautifulSoup(response.content, "html.parser")
    chapters = []
    
    # Lấy danh sách chương theo cấu trúc HTML
    chapter_items = soup.select("div.list_chapter div.works-chapter-item")
    
    for item in chapter_items:
        chapter_link = item.select_one("div.name-chap a")
        if not chapter_link:
            continue
            
        chapter_url = urljoin(comic_url, chapter_link["href"])
        chapter_title = chapter_link.text.strip()
        
        # Trích xuất số chương từ tiêu đề (vd: "Chương 13" -> 13)
        chapter_number_match = re.search(r'Chương (\d+(?:\.\d+)?)', chapter_title, re.IGNORECASE)
        chapter_number = float(chapter_number_match.group(1)) if chapter_number_match else 0

        
        chapters.append({
            "comic_id": comic_id,
            "chapter_number": chapter_number,
            "title": chapter_title,
            "url": chapter_url
        })
    
    return chapters

def save_comic_to_db(comic_data: Dict):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            slug = slugify(comic_data['Tên truyện'])

            # Kiểm tra truyện đã tồn tại
            cursor.execute("SELECT id FROM comics WHERE slug = %s", (slug,))
            result = cursor.fetchone()

            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

            if result:
                comic_id = result[0]
                print(f"Truyện '{comic_data['Tên truyện']}' đã tồn tại. Cập nhật thông tin...")

                # Cập nhật các thông tin có thể thay đổi
                update_sql = """
                    UPDATE comics SET
                        cover_image = %s,
                        views = %s,
                        follows = %s,
                        last_crawled_at = %s
                    WHERE id = %s
                """
                cursor.execute(update_sql, (
                    comic_data['Ảnh bìa'],
                    int(comic_data['Lượt xem'].replace(',', '')) if comic_data['Lượt xem'] != 'Đang cập nhật' else 0,
                    int(comic_data['Lượt theo dõi'].replace(',', '')) if comic_data['Lượt theo dõi'] != 'Đang cập nhật' else 0,
                    now,
                    comic_id
                ))
                connection.commit()
                return comic_id

            # Nếu chưa có -> thêm mới
            insert_sql = """
                INSERT INTO comics (title, slug, author, status, cover_image, views, follows, last_crawled_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(insert_sql, (
                comic_data['Tên truyện'],
                slug,
                comic_data['Tác giả'],
                'Ongoing' if 'Đang' in comic_data['Tình trạng'] else 'Completed',
                comic_data['Ảnh bìa'],
                int(comic_data['Lượt xem'].replace(',', '')) if comic_data['Lượt xem'] != 'Đang cập nhật' else 0,
                int(comic_data['Lượt theo dõi'].replace(',', '')) if comic_data['Lượt theo dõi'] != 'Đang cập nhật' else 0,
                now
            ))

            comic_id = cursor.lastrowid

            # Lưu thể loại
            for genre in comic_data['Thể loại']:
                cursor.execute("SELECT id FROM genres WHERE name = %s", (genre,))
                result = cursor.fetchone()

                if result:
                    genre_id = result[0]
                else:
                    cursor.execute("INSERT INTO genres (name) VALUES (%s)", (genre,))
                    genre_id = cursor.lastrowid

                cursor.execute(
                    "INSERT INTO comic_genres (comic_id, genre_id) VALUES (%s, %s)",
                    (comic_id, genre_id)
                )

            connection.commit()
            return comic_id
    except Exception as e:
        print(f"Lỗi khi lưu truyện vào database: {e}")
        connection.rollback()
        return None
    finally:
        connection.close()

def save_chapter_to_db(connection, chapter_data: Dict):
    try:
        with connection.cursor() as cursor:
            # Kiểm tra nếu chapter đã tồn tại
            cursor.execute(
                "SELECT id FROM chapters WHERE comic_id = %s AND chapter_number = %s",
                (chapter_data["comic_id"], chapter_data["chapter_number"])
            )
            if cursor.fetchone():
                print(f"Chương {chapter_data['chapter_number']} đã tồn tại, bỏ qua.")
                return False

            # Lưu thông tin chapter
            sql = """
            INSERT INTO chapters (comic_id, chapter_number, title, views, status)
            VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (
                chapter_data["comic_id"],
                chapter_data["chapter_number"],
                chapter_data["title"],
                0,  # Lượt xem ban đầu
                "Published"
            ))
            
        connection.commit()
        return True
    except Exception as e:
        print(f"Lỗi khi lưu chapter vào database: {e}")
        connection.rollback()
        return False


def crawl_truyen_info(url: str, crawl_chapters: bool = True) -> Optional[Dict]:
    slug = slugify(url.split("/")[-1])
    if not should_crawl_comic(slug):
        return None
    session = requests.Session()
    retries = Retry(total=5, backoff_factor=0.3, status_forcelist=[429, 500, 502, 503, 504])
    session.mount('https://', HTTPAdapter(max_retries=retries))
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    try:
        response = session.get(url, headers=headers)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Lỗi khi truy cập URL: {e}")
        return None

    soup = BeautifulSoup(response.content, "html.parser")
    
    try:
        # Lấy thông tin cơ bản của truyện
        title = soup.select_one("div.book_other h1[itemprop='name']").text.strip()
        cover = soup.select_one("div.book_avatar img[itemprop='image']")["src"]
        
        # Sửa URL ảnh bìa nếu cần
        if cover.startswith("//"):
            cover = "https:" + cover
        elif not cover.startswith("http"):
            cover = urljoin(url, cover)
            
        author = get_info_by_icon(soup, "fa-user")
        status = get_info_by_icon(soup, "fa-rss")
        likes = get_info_by_icon(soup, "fa-thumbs-up")
        follows = get_info_by_icon(soup, "fa-heart")
        views = get_info_by_icon(soup, "fa-eye")
        genres = [a.text.strip() for a in soup.select("ul.list01 li.li03 a")]

        # Tải ảnh bìa
        cover_filename = slugify(title) + ".jpg"
        cover_path = download_image(cover, 'public/images/', cover_filename)

        comic_data = {
            "Tên truyện": title,
            "Ảnh bìa": cover_path or cover,
            "Tác giả": author,
            "Tình trạng": status,
            "Lượt xem": views,
            "Lượt theo dõi": follows,
            "Thể loại": genres
        }

        comic_id = save_comic_to_db(comic_data)
        
        # Crawl danh sách chương nếu cần
        if crawl_chapters and comic_id:
            chapters = crawl_comic_chapters(url, comic_id)
            connection = get_db_connection()
            for chapter in chapters:
                save_chapter_to_db(connection, chapter)
            connection.close()

        return comic_data
    except Exception as e:
        print(f"Lỗi khi lấy thông tin truyện: {e}")
        return None

def should_crawl_comic(slug: str, within_hours: int = 24):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT last_crawled_at FROM comics WHERE slug = %s", (slug,))
            result = cursor.fetchone()
            if result and result[0]:
                last_crawled = result[0]
                if datetime.now() - last_crawled < timedelta(hours=within_hours):
                    print(f"Truyện đã được crawl gần đây, bỏ qua.")
                    return False
        return True
    except:
        return True
    finally:
        connection.close()

# Sử dụng
if __name__ == "__main__":
    url = "https://truyenqqgo.com/truyen-tranh/i-thought-she-was-a-yandere-but-apparently-shes-even-worse-fan-colored-17622"
    data = crawl_truyen_info(url, crawl_chapters=True)
    
    if data:
        print("\nThông tin truyện:")
        for k, v in data.items():
            if isinstance(v, list):
                print(f"{k}: {', '.join(v)}")
            else:
                print(f"{k}: {v}")
    else:
        print("Không thể crawl dữ liệu từ URL đã cho.")