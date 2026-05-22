from PIL import Image, ImageDraw, ImageFont
from datetime import datetime, timezone
import io

DEADLINE = datetime(2026, 5, 26, 7, 59, 59, tzinfo=timezone.utc)

def handler(request):
    now = datetime.now(timezone.utc)
    diff = DEADLINE - now
    total_seconds = max(0, int(diff.total_seconds()))

    frames = []
    for i in range(60):
        secs = (total_seconds + i) 
        s = secs % 60
        m = (secs // 60) % 60
        h = secs // 3600

        text = f"ENDS TONIGHT!  |  {h:02d} HR  :  {m:02d} MIN  :  {s:02d} SEC"

        img = Image.new("RGB", (600, 60), color=(189, 1, 7))
        draw = ImageDraw.Draw(img)

        try:
            font = ImageFont.truetype("DMSans-VariableFont_opsz,wght.ttf", size=22)
        except:
            font = ImageFont.load_default()

        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        x = (600 - text_width) / 2
        y = (60 - text_height) / 2 - bbox[1]

        draw.text((x, y), text, fill=(255, 255, 255), font=font)
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

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "image/gif",
            "Cache-Control": "no-store, max-age=0"
        },
        "body": buf.read(),
        "isBase64Encoded": True
    }
