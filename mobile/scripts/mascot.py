#!/usr/bin/env python3
"""Generate the mascot art + app icon + splash.

Two generators live here: 'nejma' (the gold star, active) and 'phil'
(the elephant, kept in case the brand swings back). Flat sticker style,
supersampled 4x for clean edges. Run from mobile/:
    python3 scripts/mascot.py
"""
import math
import os
from PIL import Image, ImageDraw, ImageFont

ACTIVE = 'nejma'

S = 4  # supersample factor
BASE = 512

# shared palette
EYE = '#2E2A26'
TERRA = '#E16B4C'
GOLD = '#F4B942'
GOLD_DARK = '#C08A2D'
PLUM = '#9A6BB5'
BLUE = '#2E8FA8'
SAND = '#F6EDE0'
NIGHT = '#232742'
W = '#FFFFFF'

# phil palette
BODY = '#8FB3CE'
DARK = '#5E87A8'
INNER = '#DCA38B'

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets')


def canvas(size=BASE):
    img = Image.new('RGBA', (size * S, size * S), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img)


def circle(d, cx, cy, r, fill, outline=None, width=0):
    d.ellipse([(cx - r) * S, (cy - r) * S, (cx + r) * S, (cy + r) * S],
              fill=fill, outline=outline, width=width * S)


def ellipse(d, cx, cy, rx, ry, fill, outline=None, width=0):
    d.ellipse([(cx - rx) * S, (cy - ry) * S, (cx + rx) * S, (cy + ry) * S],
              fill=fill, outline=outline, width=width * S)


def arc(d, cx, cy, rx, ry, start, end, width=7, fill=EYE):
    d.arc([(cx - rx) * S, (cy - ry) * S, (cx + rx) * S, (cy + ry) * S],
          start, end, fill=fill, width=width * S)


def _font(px):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
              '/usr/share/fonts/TTF/DejaVuSans-Bold.ttf'):
        if os.path.exists(p):
            return ImageFont.truetype(p, px)
    return ImageFont.load_default()


def zzz(d, color):
    for i, (x, y, sz) in enumerate([(380, 150, 44), (420, 105, 58), (462, 52, 72)]):
        d.text((x * S, y * S), 'z' if i < 2 else 'Z', font=_font(int(sz * S)), fill=color)


def heart(d, cx, cy, r, color=TERRA):
    circle(d, cx - r * 0.55, cy - r * 0.3, r * 0.62, color)
    circle(d, cx + r * 0.55, cy - r * 0.3, r * 0.62, color)
    d.polygon([((cx - r * 1.12) * S, (cy - r * 0.06) * S),
               ((cx + r * 1.12) * S, (cy - r * 0.06) * S),
               (cx * S, (cy + r * 1.05) * S)], fill=color)


def confetti(d):
    bits = [(76, 86, 12, TERRA), (430, 60, 10, PLUM), (478, 150, 9, BLUE),
            (40, 180, 9, BLUE), (150, 38, 8, PLUM), (350, 30, 9, TERRA),
            (250, 22, 8, BLUE), (488, 270, 8, PLUM), (28, 290, 8, TERRA)]
    for x, y, r, c in bits:
        circle(d, x, y, r, c)


def save(img, *path):
    out = os.path.join(OUT, *path)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    img = img.resize((img.width // S, img.height // S), Image.LANCZOS)
    img.save(out)
    print('wrote', out)


# --- Nejma the star ---------------------------------------------------------

def star_points(cx, cy, r_out, r_in, rot_deg=-90, n=5):
    pts = []
    for i in range(n * 2):
        r = r_out if i % 2 == 0 else r_in
        a = math.radians(rot_deg + i * 180 / n)
        pts.append(((cx + r * math.cos(a)) * S, (cy + r * math.sin(a)) * S))
    return pts


def star_body(d, tilt=0):
    pts = star_points(256, 268, 205, 108, rot_deg=-90 + tilt)
    d.polygon(pts, fill=GOLD)
    d.line(pts + [pts[0]], fill=GOLD_DARK, width=9 * S, joint='curve')
    # rounded tips: caps over the line joins
    for p in pts:
        d.ellipse([p[0] - 4.5 * S, p[1] - 4.5 * S, p[0] + 4.5 * S, p[1] + 4.5 * S], fill=GOLD_DARK)


def sparkle(d, cx, cy, r, color=GOLD):
    d.polygon(star_points(cx, cy, r, r * 0.36, n=4), fill=color)


def star_face(d, eyes='open', pupils=(0, 0), blush_alpha=120, mouth='smile'):
    for cx in (212, 300):
        if eyes == 'open':
            circle(d, cx + pupils[0], 252 + pupils[1], 15, EYE)
            circle(d, cx + pupils[0] - 5, 252 + pupils[1] - 5, 5, W)
        elif eyes == 'happy':
            arc(d, cx, 259, 18, 14, 195, 345, width=8)
        elif eyes == 'closed':
            arc(d, cx, 246, 18, 12, 15, 165, width=8)
    for cx in (182, 330):
        ellipse(d, cx, 292, 22, 14, (232, 140, 110, blush_alpha))
    if mouth == 'smile':
        arc(d, 256, 282, 22, 16, 25, 155, width=8)
    elif mouth == 'open':
        d.pieslice([(256 - 24) * S, (282 - 14) * S, (256 + 24) * S, (282 + 26) * S],
                   10, 170, fill=EYE)


def nejma_wave():
    img, d = canvas()
    star_body(d, tilt=10)
    star_face(d)
    for x, y, r in [(80, 120, 26), (442, 90, 20), (452, 330, 16)]:
        sparkle(d, x, y, r)
    return img


def nejma_think():
    img, d = canvas()
    star_body(d, tilt=-6)
    star_face(d, pupils=(-6, -7), mouth='smile')
    for x, y, r in [(398, 138, 8), (424, 106, 12), (455, 66, 17)]:
        circle(d, x, y, r, GOLD, GOLD_DARK, 4)
    return img


def nejma_celebrate():
    img, d = canvas()
    star_body(d)
    star_face(d, eyes='happy', mouth='open', blush_alpha=150)
    confetti(d)
    return img


def nejma_coach():
    img, d = canvas()
    star_body(d, tilt=4)
    star_face(d, blush_alpha=160)
    heart(d, 442, 110, 30)
    return img


def nejma_sleep():
    img, d = canvas()
    star_body(d, tilt=-10)
    star_face(d, eyes='closed', mouth='smile', blush_alpha=90)
    zzz(d, GOLD_DARK)
    return img


NEJMA = {'wave': nejma_wave, 'think': nejma_think, 'celebrate': nejma_celebrate,
         'coach': nejma_coach, 'sleep': nejma_sleep}


# --- Phil the elephant (retired, regenerable) -------------------------------

def bezier(p0, p1, p2, n=60):
    pts = []
    for i in range(n + 1):
        t = i / n
        x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0]
        y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1]
        pts.append((x, y))
    return pts


def trunk2(d, a, b, r0=26, r1=13):
    pts = bezier(*a) + bezier(*b)
    for (x, y), t in [(p, i / len(pts)) for i, p in enumerate(pts)]:
        circle(d, x, y, r0 + (r1 - r0) * t + 5, DARK)
    for (x, y), t in [(p, i / len(pts)) for i, p in enumerate(pts)]:
        circle(d, x, y, r0 + (r1 - r0) * t, BODY)


def phil_head(d, eyes='open', pupils=(0, 0), blush_alpha=110):
    for cx in (138, 374):
        circle(d, cx, 240, 110, BODY, DARK, 9)
        circle(d, cx, 240, 68, INNER)
    circle(d, 256, 272, 165, BODY, DARK, 9)
    for cx in (172, 342):
        ellipse(d, cx, 305, 26, 17, (232, 140, 110, blush_alpha))
    for cx in (198, 314):
        if eyes == 'open':
            circle(d, cx + pupils[0], 240 + pupils[1], 17, EYE)
            circle(d, cx + pupils[0] - 6, 240 + pupils[1] - 6, 5.5, W)
        elif eyes == 'happy':
            arc(d, cx, 248, 20, 16, 195, 345, width=8)
        elif eyes == 'closed':
            arc(d, cx, 232, 20, 14, 15, 165, width=8)
    for cx in (220, 292):
        ellipse(d, cx, 352, 12, 20, W, DARK, 3)


def phil_wave():
    img, d = canvas()
    phil_head(d)
    trunk2(d, ((256, 322), (266, 432), (330, 430)), ((330, 430), (424, 426), (442, 280)))
    return img


def phil_think():
    img, d = canvas()
    phil_head(d, pupils=(-6, -7))
    trunk2(d, ((256, 322), (218, 425), (240, 450)), ((240, 450), (262, 460), (268, 452)))
    for x, y, r in [(398, 132, 8), (424, 100, 12), (455, 60, 17)]:
        circle(d, x, y, r, BODY, DARK, 4)
    return img


def phil_celebrate():
    img, d = canvas()
    phil_head(d, eyes='happy')
    trunk2(d, ((256, 322), (246, 432), (182, 430)), ((182, 430), (88, 426), (70, 280)))
    confetti(d)
    return img


def phil_coach():
    img, d = canvas()
    phil_head(d, blush_alpha=150)
    trunk2(d, ((256, 322), (290, 430), (320, 440)), ((320, 440), (336, 446), (330, 446)))
    heart(d, 442, 110, 30)
    return img


def phil_sleep():
    img, d = canvas()
    phil_head(d, eyes='closed')
    trunk2(d, ((256, 322), (230, 425), (250, 450)), ((250, 450), (266, 458), (262, 452)))
    zzz(d, DARK)
    return img


PHIL = {'wave': phil_wave, 'think': phil_think, 'celebrate': phil_celebrate,
        'coach': phil_coach, 'sleep': phil_sleep}


# --- app art -----------------------------------------------------------------

def app_icon(hero):
    img = Image.new('RGBA', (1024 * S, 1024 * S), NIGHT)
    mascot = hero().resize((820 * S, 820 * S), Image.LANCZOS)
    img.alpha_composite(mascot, (102 * S, 102 * S))
    return img


def adaptive_icon(hero):
    img = Image.new('RGBA', (1024 * S, 1024 * S), (0, 0, 0, 0))
    mascot = hero().resize((620 * S, 620 * S), Image.LANCZOS)
    img.alpha_composite(mascot, (202 * S, 202 * S))
    return img


def splash_icon(hero, name, sub=None):
    img = Image.new('RGBA', (1024 * S, 1024 * S), (0, 0, 0, 0))
    mascot = hero().resize((540 * S, 540 * S), Image.LANCZOS)
    img.alpha_composite(mascot, (242 * S, 150 * S))
    d = ImageDraw.Draw(img)
    f = _font(130 * S)
    tw = d.textlength(name, font=f)
    d.text(((1024 * S - tw) / 2, 740 * S), name, font=f, fill=SAND)
    if sub:
        fs = _font(56 * S)
        tw = d.textlength(sub, font=fs)
        d.text(((1024 * S - tw) / 2, 905 * S), sub, font=fs, fill=GOLD)
    return img


if __name__ == '__main__':
    poses, hero, name, sub = ((NEJMA, nejma_wave, 'Tnejjem', 'you can.') if ACTIVE == 'nejma'
                              else (PHIL, phil_wave, 'Phil', None))
    for key, fn in poses.items():
        save(fn(), 'mascot', f'{key}.png')
    save(app_icon(hero), 'icon.png')
    save(adaptive_icon(hero), 'adaptive-icon.png')
    save(splash_icon(hero, name, sub), 'splash-icon.png')
