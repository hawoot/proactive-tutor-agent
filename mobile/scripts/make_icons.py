#!/usr/bin/env python3
"""Generates the app icon set (icon, Android adaptive foreground, splash).
Design: minimalist mortarboard + proactive 'nudge' dot, warm ink + cream +
amber - the app's palette. Re-run after tweaking; commit the PNGs."""
from PIL import Image, ImageDraw, ImageFilter

INK_TOP = (52, 41, 30)      # warm ink, slightly lit
INK_BOTTOM = (28, 21, 15)   # deep ink
CREAM = (247, 246, 242)
AMBER = (232, 163, 61)
S = 1024


def gradient_bg(size):
    img = Image.new("RGB", (size, size))
    for y in range(size):
        t = y / size
        img.paste(tuple(int(a + (b - a) * t) for a, b in zip(INK_TOP, INK_BOTTOM)),
                  (0, y, size, y + 1))
    return img


def draw_mark(draw, cx, cy, u, with_dot=True):
    """The mark in a u-sized box centred on (cx, cy):
    mortarboard diamond + head + tassel + nudge dot."""
    # board: wide flat diamond
    bw, bh = 0.50 * u, 0.17 * u          # half-width, half-height
    by = cy - 0.10 * u                   # board centre
    draw.polygon([(cx - bw, by), (cx, by - bh), (cx + bw, by), (cx, by + bh)],
                 fill=CREAM)
    # head: rounded trapezoid suggestion below the board
    hw, hh = 0.205 * u, 0.16 * u
    draw.rounded_rectangle([cx - hw, by + 0.06 * u, cx + hw, by + 0.06 * u + hh],
                           radius=0.07 * u, fill=CREAM)
    # tassel: line from board's right tip + amber bead
    tx, ty = cx + bw * 0.92, by + 0.01 * u
    ex, ey = tx + 0.015 * u, ty + 0.235 * u
    draw.line([(tx, ty), (ex, ey)], fill=AMBER, width=max(int(0.030 * u), 4))
    r = 0.052 * u
    draw.ellipse([ex - r, ey - r, ex + r, ey + r], fill=AMBER)
    if with_dot:
        # the 'proactive nudge': small amber dot top-right of the mark
        dr = 0.072 * u
        dx, dy = cx + 0.46 * u, cy - 0.42 * u
        draw.ellipse([dx - dr, dy - dr, dx + dr, dy + dr], fill=AMBER)


def soft_shadow(base, draw_fn, offset=10, blur=18, alpha=90):
    """Draw the mark as a soft shadow layer, then crisp on top."""
    shadow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    draw_fn(sd)
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur))
    black = Image.new("RGBA", base.size, (0, 0, 0, alpha))
    base.paste(black, (0, offset), shadow.split()[3])


def make_icon():
    img = gradient_bg(S).convert("RGBA")
    soft_shadow(img, lambda d: draw_mark(d, S / 2, S / 2, S * 0.74))
    draw_mark(ImageDraw.Draw(img), S / 2, S / 2, S * 0.74)
    img.convert("RGB").save("assets/icon.png")


def make_adaptive():
    # Android adaptive: transparent bg, mark inside the centre safe zone (~66%)
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw_mark(ImageDraw.Draw(img), S / 2, S / 2, S * 0.52)
    img.save("assets/adaptive-icon.png")


def make_splash():
    # splash: shown centred by expo on backgroundColor; keep the mark modest
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw_mark(ImageDraw.Draw(img), S / 2, S / 2, S * 0.40, with_dot=False)
    img.save("assets/splash-icon.png")


if __name__ == "__main__":
    import os
    os.makedirs("assets", exist_ok=True)
    make_icon(); make_adaptive(); make_splash()
    print("wrote assets/icon.png, adaptive-icon.png, splash-icon.png")
