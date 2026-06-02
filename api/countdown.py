from PIL import Image, ImageDraw, ImageFont
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler
import io
import os

DEADLINE = datetime(2026, 5, 26, 7, 59, 59, tzinfo=timezone.utc)

def make_font(path, size, weight=400):
    try:
        font = ImageFont.truetype(path, size=size)
        font.set_variation_by_axes([size, weight])
        return font
    except:
        try:
            return ImageFont.truetype(path, size=size)
        except:
            return ImageFont.load_default()

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        now = datetime.now(timezone.utc)
        diff = DEADLINE - now
        total_seconds = max(0, int(diff.total_seconds()))

        font_path = os.path.join(os.path.dirname(__file__), '..', 'DMSans-VariableFont_opsz,wght.ttf')

        try:
            font_regular = ImageFont.truetype(font_path, size=20)
            font_regular.set_variation_by_axes([20, 400])
            font_bold = ImageFont.truetype(font_path, size=20)
            font_bold.set_variation_by_axes([20, 700])
        except:
            font_regular = ImageFont.load_default()
            font_bold = font_regular

        frames = []
        for i in range(10):
            secs = total_seconds - i
            if secs < 0:
                secs = 0
            s = secs % 60
            m = (secs // 60) % 60
            h = secs // 3600

            img = Image.new("RGB", (600, 60), color=(189, 1, 7))
            draw = ImageDraw.Draw(img)

            # Build the full text to measure total width for centering
            label = "ENDS TONIGHT!"
            separator = "  |  "
            countdown = f"{h:02d} HR  :  {m:02d} MIN  :  {s:02d} SEC"

            label_bbox = draw.textbbox((0, 0), label, font=font_bold)
            sep_bbox = draw.textbbox((0, 0), separator, font=font_regular)
            countdown_bbox = draw.textbbox((0, 0), countdown, font=font_bold)

            total_width = (label_bbox[2] - label_bbox[0]) + (sep_bbox[2] - sep_bbox[0]) + (countdown_bbox[2] - countdown_bbox[0])
            
            start_x = (600 - total_width) / 2
            y = (60 - (label_bbox[3] - label_bbox[1])) / 2 - label_bbox[1]

            # Draw each segment
            draw.text((start_x, y), label, fill=(255, 255, 255), font=font_bold)
            x2 = start_x + (label_bbox[2] - label_bbox[0])
            draw.text((x2, y), separator, fill=(255, 255, 255), font=font_regular)
            x3 = x2 + (sep_bbox[2] - sep_bbox[0])
            draw.text((x3, y), countdown, fill=(255, 255, 255), font=font_bold)

            frames.append(img)

        buf = io.BytesIO()
        frames[0].save(
            buf,
            format="GIF",
            save_all=True,
            append_images=frames[1:],
            loop=0,
            duration=1000,
            optimize=False
        )
        buf.seek(0)
        gif_data = buf.read()

        self.send_response(200)
        self.send_header('Content-Type', 'image/gif')
        self.send_header('Cache-Control', 'public, max-age=60, s-maxage=60')
        self.end_headers()
        self.wfile.write(gif_data)
