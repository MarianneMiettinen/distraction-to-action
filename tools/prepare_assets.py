"""
Turns the raw drawings in design/ into the runtime assets in public/art/.

Three things need doing that can't be done in CSS:
  1. Margorn is painted onto the mountain at step 1. He has to move, so he gets
     cloned out of the slope and cut into his own sprite.
  2. Completed steps go from purple to green. Instead of covering the painted
     crystals with a flat CSS blob, a second copy of the mountain is generated
     with the purple hue rotated to green — the app reveals it through an
     ellipse mask, so the original brushwork survives.
  3. The UI frames (card, button, back arrow) are cut out of the hi-fi
     onboarding drawing so the real thing is used, not a CSS imitation.

Run:  python tools/prepare_assets.py
"""

import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "design")
OUT = os.path.join(ROOT, "public", "art")
os.makedirs(OUT, exist_ok=True)


def src(name):
    return Image.open(os.path.join(SRC, name))


def cutout(img, circle=False):
    """Lift a drawn control off its black backdrop so it sits on the app's stone."""
    if circle:
        alpha = Image.new("L", img.size, 0)
        ImageDraw.Draw(alpha).ellipse((2, 2, img.width - 3, img.height - 3), fill=255)
        alpha = alpha.filter(ImageFilter.GaussianBlur(1.6))
    else:
        lum = np.asarray(img.convert("RGB")).max(axis=2)
        solid = ndimage.binary_fill_holes(lum > 40)
        solid = ndimage.binary_closing(solid, np.ones((9, 9)))
        solid = ndimage.binary_fill_holes(solid)
        lab, n = ndimage.label(solid)
        if n > 1:
            sizes = ndimage.sum(solid, lab, range(1, n + 1))
            solid = lab == int(np.argmax(sizes)) + 1
        alpha = Image.fromarray((solid * 255).astype(np.uint8), "L").filter(
            ImageFilter.GaussianBlur(1.4)
        )
    out = img.convert("RGBA")
    out.putalpha(alpha)
    return out


def clone_patch(img, box, dx, dy, feather=10, inset=8):
    """Copy a patch from (box + offset) over box, with feathered edges."""
    piece = img.crop((box[0] + dx, box[1] + dy, box[2] + dx, box[3] + dy))
    mask = Image.new("L", (box[2] - box[0], box[3] - box[1]), 0)
    ImageDraw.Draw(mask).rectangle(
        (inset, inset, mask.width - inset, mask.height - inset), fill=255
    )
    img.paste(piece, (box[0], box[1]), mask.filter(ImageFilter.GaussianBlur(feather)))


# ---------------------------------------------------------------- mountain ---
def build_mountain():
    m = src("margorn-steps-mountain-polished.png").convert("RGB")
    # Lift the painted character off the slope; the rock above him is plain,
    # so it clones down cleanly. The green ring of step 1 is left untouched.
    clone_patch(m, (148, 664, 334, 890), 232, -124)
    m.save(os.path.join(OUT, "mountain.jpg"), quality=90, optimize=True)

    # Green ("climbed") variant: rotate the purple crystals round the wheel.
    a = np.asarray(m).astype(np.float32)
    R, G, B = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    weight = np.clip((B - G) / 55.0, 0, 1) * np.clip((R - G) / 35.0, 0, 1)
    weight = np.asarray(
        Image.fromarray((weight * 255).astype(np.uint8), "L").filter(
            ImageFilter.GaussianBlur(2)
        )
    ).astype(np.float32) / 255.0

    hsv = np.asarray(m.convert("HSV")).astype(np.int16)
    hsv[:, :, 0] = (hsv[:, :, 0] - 128) % 256          # violet -> green
    hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 1.12, 0, 255)
    hsv[:, :, 2] = np.clip(hsv[:, :, 2] * 1.06, 0, 255)
    shifted = np.asarray(
        Image.fromarray(hsv.astype(np.uint8), "HSV").convert("RGB")
    ).astype(np.float32)

    w3 = weight[:, :, None]
    lit = (a * (1 - w3) + shifted * w3).clip(0, 255).astype(np.uint8)
    Image.fromarray(lit, "RGB").save(
        os.path.join(OUT, "mountain-lit.jpg"), quality=90, optimize=True
    )
    print("mountain.jpg / mountain-lit.jpg", m.size)


# ------------------------------------------------------------------ sprite ---
def build_sprite():
    im = src("margorn-polished-side.png").convert("RGB")
    a = np.asarray(im).astype(int)
    mn, mx = a.min(axis=2), a.max(axis=2)

    paper = (mn > 232) & ((mx - mn) < 18)
    lab, n = ndimage.label(paper)
    sizes = ndimage.sum(paper, lab, range(1, n + 1))
    big = [int(i) + 1 for i, s in enumerate(sizes) if s > 400]
    solid = ~np.isin(lab, big)

    lab2, n2 = ndimage.label(solid, np.ones((3, 3)))
    keep = int(np.argmax(ndimage.sum(solid, lab2, range(1, n2 + 1)))) + 1
    solid = lab2 == keep

    rgba = np.dstack([a.astype(np.uint8), (solid * 255).astype(np.uint8)])
    h, w = solid.shape
    rows = np.arange(h)[:, None] * np.ones((1, w))
    pencil = (mn > 170) & ((mx - mn) < 40) & (rows > h * 0.90)   # ground scribble
    rgba[:, :, 3][pencil] = 0

    img = Image.fromarray(rgba, "RGBA")
    img = img.crop(img.getchannel("A").getbbox())
    img.putalpha(img.getchannel("A").filter(ImageFilter.GaussianBlur(0.7)))
    img = img.resize((img.width // 2, img.height // 2), Image.LANCZOS)
    img.save(os.path.join(OUT, "margorn.png"), optimize=True)
    print("margorn.png", img.size)


# ---------------------------------------------------------------- UI frames ---
def build_ui():
    ui = src("onboarding high-fi  - set the bad habit.png").convert("RGB")

    card = ui.crop((40, 528, 898, 1306))
    clone_patch(card, (46, 92, 624, 262), 24, 330, feather=16, inset=10)  # drop the sample text
    card.save(os.path.join(OUT, "ui-card.png"), optimize=True)

    # The drawn button carries the word "Continue"; the app supplies its own
    # label, so the engraved stone behind it is rebuilt from a clean slice.
    button = ui.crop((130, 1338, 782, 1538))
    slab = button.crop((96, 38, 156, 162))
    band = Image.new("RGB", (390, slab.height))
    for x in range(0, band.width, slab.width):
        band.paste(slab, (x, 0))
    band = band.filter(ImageFilter.GaussianBlur(1.2))
    seam = Image.new("L", band.size, 0)
    ImageDraw.Draw(seam).rectangle((6, 6, band.width - 6, band.height - 6), fill=255)
    button.paste(band, (140, 38), seam.filter(ImageFilter.GaussianBlur(7)))
    cutout(button).save(os.path.join(OUT, "ui-button.png"), optimize=True)

    cutout(ui.crop((30, 55, 178, 203)), circle=True).save(
        os.path.join(OUT, "ui-back.png"), optimize=True
    )
    cutout(ui.crop((783, 1523, 907, 1647)), circle=True).save(
        os.path.join(OUT, "ui-sound.png"), optimize=True
    )
    print("ui-card / ui-button / ui-back / ui-sound", card.size)


# ------------------------------------------------------------------ stills ---
def build_stills():
    def shrink(name, out, width, quality=88):
        im = src(name).convert("RGB")
        h = round(im.height * width / im.width)
        im.resize((width, h), Image.LANCZOS).save(
            os.path.join(OUT, out), quality=quality, optimize=True
        )
        print(out, (width, h))

    shrink("margorn-polished-front.png", "margorn-front.jpg", 900)
    shrink("ring-falls-polished1.png", "ring-held.jpg", 760)
    shrink("ring-falls-polished2.png", "ring-falling.jpg", 760)
    src("black-stone-background.jpg").convert("RGB").save(
        os.path.join(OUT, "stone.jpg"), quality=92, optimize=True
    )
    print("stone.jpg")


if __name__ == "__main__":
    build_mountain()
    build_sprite()
    build_ui()
    build_stills()
