import argparse
import json
import os
import random
import re
import sys
import time
import unicodedata
from typing import Dict, List, Optional
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEB_ROOT = os.path.normpath(os.path.join(BASE_DIR, ".."))
PUBLIC_IMAGES_ROOT = os.path.join(WEB_ROOT, "services", "story-service", "public", "images")
DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

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

def download_chapter_images(chapter_url: str, save_dir: str) -> List[str]:
    os.makedirs(save_dir, exist_ok=True)
    print(f"Đang tải ảnh cho chương: {chapter_url}")
    try:
        time.sleep(random.uniform(1.5, 2.5))
        response = requests.get(chapter_url, headers={**DEFAULT_HEADERS, "Referer": chapter_url}, timeout=15)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"Lỗi khi truy cập chương {chapter_url}: {e}")
        return []

    soup = BeautifulSoup(response.content, "html.parser")
    image_tags = soup.select(".chapter-content img, .chapter_content img, #chapter-content img")
    saved_paths = []

    session = requests.Session()
    session.headers.update(DEFAULT_HEADERS)
    session.headers["Referer"] = chapter_url

    for index, img_tag in enumerate(image_tags, start=1):
        src = img_tag.get("data-src") or img_tag.get("src")
        if not src:
            continue
        if src.startswith("//"):
            src = "https:" + src
        elif not src.startswith("http"):
            src = urljoin(chapter_url, src)

        filename = f"{index:03}.jpg"
        save_path = os.path.join(save_dir, filename)

        try:
            time.sleep(random.uniform(1.0, 2.0))
            img_response = session.get(src, stream=True, timeout=15)
            img_response.raise_for_status()
            with open(save_path, "wb") as img_file:
                for chunk in img_response.iter_content(1024):
                    img_file.write(chunk)
            saved_paths.append(save_path)
            print(f"  Đã lưu ảnh: {save_path}")
        except Exception as e:
            print(f"  Lỗi khi tải ảnh {src}: {e}")

    print(f"Hoàn tất {len(saved_paths)} ảnh cho chương: {chapter_url}")
    return saved_paths

def print_comic_summary(comic_data: Dict):
    print("\n--- Thông tin truyện đã crawl ---")
    for key, value in comic_data.items():
        if isinstance(value, list):
            print(f"{key}:")
            for item in value:
                if isinstance(item, dict):
                    summary = ", ".join(f"{k}={v}" for k, v in item.items())
                    print(f"  - {summary}")
                else:
                    print(f"  - {item}")
        else:
            print(f"{key}: {value}")



def get_info_by_icon(soup, icon_class):
    items = soup.select("ul.list-info li.row")
    for item in items:
        icon = item.select_one("i")
        if icon and icon_class in icon["class"]:
            value_tag = item.select_one("p.col-xs-9")
            if value_tag:
                return value_tag.text.strip()
    return "Đang cập nhật"

def crawl_comic_chapters(comic_url: str) -> List[Dict]:
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
            "chapter_number": chapter_number,
            "title": chapter_title,
            "url": chapter_url
        })
    
    return chapters

def crawl_truyen_info(url: str, crawl_chapters: bool = True) -> Optional[Dict]:
    slug = slugify(url.split("/")[-1])
    save_directory = os.path.join(PUBLIC_IMAGES_ROOT, slug)
    os.makedirs(save_directory, exist_ok=True)
    session = requests.Session()
    retries = Retry(total=5, backoff_factor=0.3, status_forcelist=[429, 500, 502, 503, 504])
    session.mount('https://', HTTPAdapter(max_retries=retries))
    
    try:
        response = session.get(url, headers=DEFAULT_HEADERS)
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

        # Tải ảnh bìa - lưu với tên "cover.jpg" để khớp với story-service
        cover_path = download_image(cover, save_directory, "cover.jpg")
        # URL path để khớp với story-service: /public/images/{slug}/cover.jpg
        cover_relative = f"/public/images/{slug}/cover.jpg" if cover_path else cover

        comic_data = {
            "Tên truyện": title,
            "Ảnh bìa": cover_relative or cover,
            "Tác giả": author,
            "Tình trạng": status,
            "Lượt xem": views,
            "Lượt theo dõi": follows,
            "Thể loại": genres,
            "Thư mục lưu": os.path.relpath(save_directory, WEB_ROOT) if os.path.isabs(save_directory) else save_directory
        }
        if likes:
            comic_data["Lượt thích"] = likes

        chapters_data: List[Dict] = []
        if crawl_chapters:
            chapters = crawl_comic_chapters(url)
            for chapter in chapters:
                chapter_number = chapter["chapter_number"]
                # Sử dụng số chương trực tiếp (không có prefix "chapter_") để khớp với story-service
                chapter_num_str = str(int(chapter_number)) if chapter_number == int(chapter_number) else str(chapter_number)
                chapter_dir = os.path.join(save_directory, chapter_num_str)
                image_paths = download_chapter_images(chapter["url"], chapter_dir)
                # Tạo URL paths để khớp với story-service: /public/images/{slug}/{chapterNumber}/{filename}
                image_rel_paths = []
                for idx, path in enumerate(image_paths, start=1):
                    filename = os.path.basename(path)
                    url_path = f"/public/images/{slug}/{chapter_num_str}/{filename}"
                    image_rel_paths.append(url_path)
                chapters_data.append({
                    "Số chương": chapter_number,
                    "Tiêu đề": chapter["title"],
                    "URL": chapter["url"],
                    "Thư mục": os.path.relpath(chapter_dir, WEB_ROOT) if os.path.isabs(chapter_dir) else chapter_dir,
                    "Ảnh đã tải": image_rel_paths
                })

        if chapters_data:
            comic_data["Danh sách chương"] = chapters_data

        info_path = os.path.join(save_directory, "info.json")
        try:
            with open(info_path, "w", encoding="utf-8") as info_file:
                json.dump(
                    {k: v for k, v in comic_data.items() if k != "Thư mục lưu"},
                    info_file,
                    ensure_ascii=False,
                    indent=2
                )
            comic_data["Thông tin lưu"] = os.path.relpath(info_path, WEB_ROOT) if os.path.isabs(info_path) else info_path
        except Exception as e:
            print(f"Lỗi khi lưu thông tin truyện: {e}")

        return comic_data
    except Exception as e:
        print(f"Lỗi khi lấy thông tin truyện: {e}")
        return None


def parse_args():
    parser = argparse.ArgumentParser(description="Crawl thông tin truyện từ truyenqq.")
    parser.add_argument("--url", help="Đường dẫn truyện cần crawl")
    parser.add_argument(
        "--skip-chapters",
        action="store_true",
        help="Bỏ qua việc tải ảnh các chương"
    )
    return parser.parse_args()


def main():
    args = parse_args()
    url = args.url

    if not url:
        print("Vui lòng cung cấp URL truyện bằng tham số --url.", file=sys.stderr)
        sys.exit(1)

    print(f"Bắt đầu crawl truyện từ URL: {url}")
    data = crawl_truyen_info(url, crawl_chapters=not args.skip_chapters)

    if data:
        print_comic_summary(data)
        info_path = data.get("Thông tin lưu")
        if info_path:
            print(f"File thông tin: {info_path}")
        sys.exit(0)

    print("Không thể crawl dữ liệu từ URL đã cho.", file=sys.stderr)
    sys.exit(2)


if __name__ == "__main__":
    main()