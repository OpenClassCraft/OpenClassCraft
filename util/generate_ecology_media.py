#!/usr/bin/env python3
"""Generate compact wildlife textures, inventory portraits, and original sounds.

The game deliberately ships reproducible, low-resolution media so classroom
machines do not need large photorealistic texture packs.  Everything produced
by this script is original OpenClassCraft media and requires only Python's
standard library.
"""

from __future__ import annotations

import math
import pathlib
import random
import struct
import wave
import zlib


ROOT = pathlib.Path(__file__).resolve().parents[1]
ECOLOGY = ROOT / "games/luanti_edu/mods/openclasscraft_ecology"
WORLD = ROOT / "games/luanti_edu/mods/openclasscraft_world"
TEXTURES = ECOLOGY / "textures"
ECOLOGY_SOUNDS = ECOLOGY / "sounds"
WORLD_SOUNDS = WORLD / "sounds"
SAMPLE_RATE = 22_050


SPECIES = {
    "rabbit": ((129, 119, 107), (202, 192, 180), (72, 64, 59), "fleck"),
    "deer": ((151, 91, 47), (223, 188, 139), (62, 44, 31), "dapple"),
    "fox": ((194, 82, 27), (238, 221, 184), (54, 37, 31), "fur"),
    "squirrel": ((139, 91, 53), (212, 175, 119), (62, 48, 38), "stripe"),
    "duck": ((91, 91, 77), (40, 111, 78), (211, 134, 34), "feather"),
    "cow": ((226, 219, 199), (192, 133, 116), (39, 38, 36), "patch"),
    "chicken": ((199, 151, 84), (186, 47, 38), (101, 66, 35), "feather"),
    "dog": ((174, 119, 68), (226, 193, 143), (69, 48, 36), "fur"),
    "cat": ((137, 112, 82), (220, 207, 184), (49, 47, 43), "stripe"),
    "frog": ((91, 127, 54), (176, 177, 101), (42, 66, 34), "mottle"),
    "otter": ((91, 68, 51), (164, 130, 94), (42, 36, 31), "sheen"),
    "boar": ((79, 68, 59), (151, 126, 94), (37, 34, 31), "bristle"),
    "tahr": ((151, 119, 79), (215, 190, 150), (67, 52, 39), "long_fur"),
    "turtle": ((92, 101, 55), (149, 131, 73), (52, 67, 58), "scute"),
}


def clamp(value: float, low: int = 0, high: int = 255) -> int:
    return max(low, min(high, round(value)))


def png_bytes(width: int, height: int, pixels: list[tuple[int, int, int, int]]) -> bytes:
    raw = bytearray()
    for y in range(height):
        raw.append(0)
        for pixel in pixels[y * width:(y + 1) * width]:
            raw.extend(pixel)
    signature = b"\x89PNG\r\n\x1a\n"

    def chunk(kind: bytes, payload: bytes) -> bytes:
        return (struct.pack(">I", len(payload)) + kind + payload
                + struct.pack(">I", zlib.crc32(kind + payload) & 0xFFFFFFFF))

    return (signature + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b""))


def mix(a: tuple[int, int, int], b: tuple[int, int, int], amount: float):
    return tuple(clamp(a[index] * (1 - amount) + b[index] * amount) for index in range(3))


def texture_pattern(kind: str, x: int, y: int, rng: random.Random) -> float:
    if kind == "dapple":
        return 0.13 if ((x // 15 + y // 13 * 3) % 11 in (0, 5)) else 0
    if kind == "stripe":
        return -0.15 if ((x + int(math.sin(y / 9) * 5)) % 30) < 5 else 0
    if kind == "patch":
        return -0.32 if math.sin(x / 17) + math.cos(y / 15) + math.sin((x + y) / 23) > 1.0 else 0
    if kind == "feather":
        return math.sin(x / 7 + (y // 8) * 0.8) * 0.055
    if kind == "mottle":
        return math.sin(x / 8) * math.cos(y / 11) * 0.11
    if kind == "sheen":
        return max(0, math.sin((x + y) / 21)) * 0.08
    if kind == "bristle":
        return -0.12 if (x * 3 + y * 7) % 19 < 3 else 0.02
    if kind == "long_fur":
        return -0.10 if (x + y * 2) % 23 < 3 else math.sin(y / 5) * 0.035
    if kind == "scute":
        cell = ((x // 18) + (y // 16)) % 2
        edge = x % 18 < 2 or y % 16 < 2
        return -0.13 if edge else cell * 0.055
    if kind == "fleck":
        return -0.09 if (x * 5 + y * 11) % 37 < 3 else 0
    if kind == "fur":
        return math.sin((x * 2 + y) / 9) * 0.04
    return rng.uniform(-0.02, 0.02)


def material_texture(species: str, material: str, size: int = 128):
    fur, accent, dark, pattern = SPECIES[species]
    bases = {"fur": fur, "accent": accent, "dark": dark}
    base = bases[material]
    rng = random.Random(f"openclasscraft:{species}:{material}")
    pixels = []
    for y in range(size):
        for x in range(size):
            patterned = texture_pattern(pattern, x, y, rng) if material == "fur" else 0
            directional = math.sin((x + y * 3) / 6) * (0.018 if material != "dark" else 0.01)
            noise = rng.uniform(-0.035, 0.035)
            shade = 1 + patterned + directional + noise
            pixels.append(tuple(clamp(channel * shade) for channel in base) + (255,))
    return png_bytes(size, size, pixels)


def eye_texture(size: int = 32):
    pixels = []
    center = (size - 1) / 2
    for y in range(size):
        for x in range(size):
            dx, dy = (x - center) / (size / 2), (y - center) / (size / 2)
            radius = dx * dx + dy * dy
            if radius > 0.94:
                color = (38, 32, 25, 255)
            elif radius > 0.62:
                color = (115, 75, 34, 255)
            else:
                color = (11, 13, 12, 255)
            if (x - size * .35) ** 2 + (y - size * .30) ** 2 < (size * .11) ** 2:
                color = (245, 250, 239, 255)
            pixels.append(color)
    return png_bytes(size, size, pixels)


def fill_polygon(canvas, width, height, points, color):
    min_y = max(0, math.floor(min(y for _, y in points)))
    max_y = min(height - 1, math.ceil(max(y for _, y in points)))
    for y in range(min_y, max_y + 1):
        intersections = []
        for index, (x1, y1) in enumerate(points):
            x2, y2 = points[(index + 1) % len(points)]
            if (y1 <= y < y2) or (y2 <= y < y1):
                intersections.append(x1 + (y - y1) * (x2 - x1) / (y2 - y1))
        intersections.sort()
        for start in range(0, len(intersections) - 1, 2):
            for x in range(max(0, math.ceil(intersections[start])),
                           min(width, math.floor(intersections[start + 1]) + 1)):
                canvas[y * width + x] = color


def fill_circle(canvas, width, height, cx, cy, radius, color):
    for y in range(max(0, int(cy - radius)), min(height, int(cy + radius) + 1)):
        for x in range(max(0, int(cx - radius)), min(width, int(cx + radius) + 1)):
            if (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2:
                canvas[y * width + x] = color


def spawn_icon(species: str, size: int = 256):
    fur, accent, dark, _ = SPECIES[species]
    canvas = [(0, 0, 0, 0)] * (size * size)
    fill_circle(canvas, size, size, 128, 128, 105, (237, 244, 231, 255))
    fill_circle(canvas, size, size, 128, 128, 94, (207, 226, 208, 255))

    def poly(points, color):
        fill_polygon(canvas, size, size, points, color + (255,))

    def circle(x, y, radius, color):
        fill_circle(canvas, size, size, x, y, radius, color + (255,))

    eye = (198, 98)
    if species == "rabbit":
        circle(61, 144, 15, accent)
        poly([(54, 145), (65, 107), (109, 91), (166, 103), (181, 142),
              (153, 171), (91, 174)], fur)
        poly([(151, 113), (175, 83), (216, 88), (229, 112), (205, 132), (165, 133)], accent)
        poly([(172, 88), (174, 35), (188, 79)], fur)
        poly([(198, 86), (211, 43), (214, 94)], fur)
        poly([(85, 164), (108, 164), (104, 191), (76, 191)], dark)
        poly([(141, 160), (169, 160), (178, 184), (146, 187)], dark)
        eye = (202, 101)
    elif species == "deer":
        poly([(41, 131), (66, 102), (133, 94), (174, 107), (168, 145), (99, 157), (55, 148)], fur)
        for leg_x in (68, 91, 140, 158):
            poly([(leg_x, 143), (leg_x + 11, 143), (leg_x + 8, 197), (leg_x - 2, 197)], dark)
        poly([(150, 112), (169, 72), (193, 66), (211, 88), (202, 117), (176, 127)], accent)
        poly([(173, 74), (163, 47), (178, 65)], fur)
        poly([(194, 69), (207, 48), (205, 78)], fur)
        # Readable antler forks.
        poly([(181, 69), (178, 32), (183, 32), (188, 55), (198, 38), (202, 41), (193, 68)], dark)
        eye = (193, 82)
    elif species == "fox":
        poly([(50, 139), (21, 116), (31, 102), (70, 112), (88, 134), (76, 156)], accent)
        poly([(35, 107), (15, 88), (22, 80), (65, 99)], fur)
        poly([(62, 141), (78, 105), (130, 91), (177, 102), (190, 139), (161, 166), (96, 169)], fur)
        poly([(151, 109), (177, 72), (219, 84), (237, 112), (210, 132), (169, 131)], fur)
        poly([(175, 76), (181, 46), (194, 78)], dark)
        poly([(207, 81), (220, 55), (221, 92)], dark)
        poly([(206, 113), (238, 112), (225, 126)], dark)
        poly([(77, 160), (99, 160), (94, 193), (73, 193)], dark)
        poly([(144, 158), (166, 158), (174, 188), (151, 190)], dark)
        eye = (203, 96)
    elif species == "squirrel":
        circle(52, 104, 34, fur)
        circle(39, 132, 30, fur)
        circle(59, 80, 23, accent)
        poly([(62, 149), (80, 111), (129, 100), (173, 116), (171, 157), (119, 174), (78, 169)], fur)
        poly([(148, 117), (174, 82), (215, 91), (226, 118), (204, 139), (167, 139)], accent)
        poly([(175, 88), (181, 58), (195, 89)], fur)
        poly([(202, 91), (214, 69), (215, 101)], fur)
        poly([(85, 164), (106, 164), (101, 192), (80, 192)], dark)
        poly([(140, 160), (164, 160), (172, 185), (146, 188)], dark)
        eye = (202, 103)
    elif species == "duck":
        poly([(43, 147), (62, 115), (111, 101), (166, 112), (190, 143),
              (168, 170), (96, 176), (57, 164)], fur)
        poly([(83, 124), (119, 114), (161, 130), (137, 158), (96, 156)], accent)
        circle(181, 96, 31, accent)
        poly([(199, 95), (235, 102), (239, 114), (205, 119), (192, 109)], dark)
        poly([(86, 168), (105, 168), (101, 194), (78, 194)], dark)
        poly([(145, 167), (164, 167), (174, 190), (150, 192)], dark)
        eye = (188, 89)
    elif species == "cow":
        poly([(38, 139), (53, 99), (119, 86), (177, 101), (194, 144),
              (172, 169), (74, 170), (43, 157)], fur)
        circle(88, 112, 22, dark)
        circle(142, 146, 19, accent)
        for leg_x in (62, 91, 146, 169):
            poly([(leg_x, 158), (leg_x + 14, 158), (leg_x + 11, 199), (leg_x - 2, 199)], dark)
        poly([(158, 112), (177, 78), (218, 84), (231, 111), (210, 137), (172, 132)], accent)
        poly([(178, 82), (166, 61), (191, 78)], fur)
        poly([(210, 84), (226, 64), (222, 95)], fur)
        poly([(173, 78), (158, 69), (164, 62), (186, 74)], dark)
        poly([(214, 80), (231, 70), (234, 78), (220, 89)], dark)
        eye = (204, 98)
    elif species == "chicken":
        poly([(45, 145), (56, 109), (99, 88), (154, 101), (179, 139),
              (158, 172), (89, 179), (58, 164)], fur)
        poly([(50, 115), (25, 91), (34, 137), (23, 151), (60, 157)], dark)
        circle(176, 99, 29, accent)
        circle(163, 67, 11, (186, 47, 38))
        circle(177, 64, 12, (186, 47, 38))
        circle(191, 70, 10, (186, 47, 38))
        poly([(194, 98), (230, 109), (195, 120)], dark)
        poly([(87, 170), (99, 170), (95, 199), (83, 199)], dark)
        poly([(142, 168), (153, 168), (161, 196), (149, 197)], dark)
        eye = (184, 94)
    elif species == "dog":
        poly([(48, 143), (62, 103), (116, 91), (174, 104), (190, 145),
              (161, 169), (80, 168)], fur)
        poly([(52, 118), (27, 86), (36, 76), (70, 108)], accent)
        poly([(151, 111), (173, 76), (217, 87), (231, 116), (207, 137), (166, 134)], accent)
        poly([(170, 82), (162, 55), (190, 80), (184, 111)], dark)
        poly([(209, 88), (224, 70), (222, 105), (207, 116)], dark)
        poly([(205, 116), (233, 115), (222, 128)], dark)
        poly([(76, 160), (98, 160), (95, 194), (73, 194)], dark)
        poly([(144, 159), (167, 159), (174, 189), (151, 191)], dark)
        eye = (202, 99)
    elif species == "cat":
        poly([(47, 145), (62, 106), (114, 94), (170, 108), (181, 147),
              (155, 169), (83, 169)], fur)
        poly([(52, 135), (28, 107), (24, 74), (33, 70), (45, 105), (68, 125)], dark)
        poly([(150, 113), (174, 80), (214, 88), (228, 115), (205, 135), (164, 135)], accent)
        poly([(174, 84), (181, 54), (195, 86)], fur)
        poly([(201, 86), (216, 60), (218, 98)], fur)
        poly([(80, 160), (99, 160), (95, 194), (77, 194)], dark)
        poly([(141, 159), (161, 159), (168, 190), (148, 191)], dark)
        eye = (202, 99)
    elif species == "frog":
        poly([(39, 156), (58, 123), (97, 111), (149, 118), (172, 151),
              (150, 171), (85, 174)], fur)
        poly([(53, 149), (25, 176), (69, 174), (98, 154)], dark)
        poly([(143, 151), (183, 177), (224, 171), (188, 147)], dark)
        poly([(119, 128), (145, 96), (194, 99), (217, 130), (195, 153), (148, 151)], accent)
        circle(160, 96, 14, fur)
        circle(199, 103, 14, fur)
        eye = (199, 100)
    elif species == "otter":
        poly([(59, 154), (23, 170), (16, 160), (62, 130), (94, 125)], dark)
        poly([(46, 143), (68, 111), (133, 102), (183, 119), (190, 151),
              (158, 169), (82, 168)], fur)
        poly([(157, 121), (179, 87), (215, 94), (231, 118), (213, 138), (174, 139)], accent)
        circle(181, 88, 8, fur)
        circle(211, 94, 8, fur)
        poly([(209, 119), (234, 118), (224, 129)], dark)
        poly([(75, 160), (99, 160), (92, 185), (66, 183)], dark)
        poly([(143, 159), (167, 159), (177, 182), (150, 184)], dark)
        eye = (204, 107)
    elif species == "boar":
        poly([(39, 147), (52, 105), (111, 88), (176, 101), (198, 139),
              (178, 169), (72, 171), (45, 160)], fur)
        poly([(157, 113), (176, 85), (217, 93), (239, 120), (222, 143), (174, 139)], accent)
        poly([(177, 90), (184, 66), (199, 93)], dark)
        poly([(211, 97), (241, 106), (242, 129), (216, 131)], dark)
        poly([(218, 130), (230, 147), (237, 128)], (235, 221, 179))
        for leg_x in (68, 96, 150, 175):
            poly([(leg_x, 159), (leg_x + 15, 159), (leg_x + 11, 194), (leg_x - 2, 194)], dark)
        eye = (207, 107)
    elif species == "tahr":
        poly([(42, 143), (58, 101), (113, 86), (172, 101), (190, 143),
              (166, 169), (75, 169)], fur)
        for leg_x in (69, 94, 145, 169):
            poly([(leg_x, 157), (leg_x + 13, 157), (leg_x + 9, 198), (leg_x - 2, 198)], dark)
        poly([(151, 112), (174, 76), (214, 83), (229, 110), (209, 136), (166, 133)], accent)
        poly([(174, 82), (158, 46), (164, 32), (181, 73)], dark)
        poly([(203, 83), (219, 48), (216, 34), (194, 77)], dark)
        poly([(193, 126), (205, 157), (213, 127)], dark)
        eye = (202, 97)
    elif species == "turtle":
        poly([(64, 145), (31, 125), (24, 139), (61, 160)], dark)
        poly([(91, 104), (67, 72), (83, 65), (113, 99)], dark)
        poly([(151, 105), (179, 72), (194, 78), (177, 119)], dark)
        poly([(157, 157), (193, 178), (201, 166), (174, 143)], dark)
        poly([(45, 142), (65, 109), (112, 94), (167, 108), (188, 139),
              (164, 168), (92, 174), (58, 160)], fur)
        poly([(66, 136), (88, 108), (128, 101), (164, 121), (167, 151),
              (133, 166), (92, 160)], accent)
        poly([(89, 110), (107, 136), (87, 155)], dark)
        poly([(130, 102), (124, 137), (157, 122)], dark)
        poly([(116, 138), (137, 162), (98, 160)], dark)
        poly([(164, 121), (190, 107), (222, 115), (235, 134), (218, 149), (183, 146)], accent)
        eye = (211, 124)

    circle(eye[0], eye[1], 9, (13, 15, 14))
    circle(eye[0] - 3, eye[1] - 3, 3, (246, 250, 241))
    return png_bytes(size, size, canvas)


def envelope(time: float, duration: float, attack: float = .04, release: float = .12) -> float:
    return min(1, time / attack) * min(1, max(0, duration - time) / release)


def write_wave(path: pathlib.Path, samples: list[float]):
    path.parent.mkdir(parents=True, exist_ok=True)
    pcm = bytearray()
    for value in samples:
        pcm.extend(struct.pack("<h", clamp(value * 32767, -32767, 32767)))
    with wave.open(str(path), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(SAMPLE_RATE)
        output.writeframes(bytes(pcm))


def voice(duration: float, base: float, sweep: float, pulse: float, seed: int):
    rng = random.Random(seed)
    samples = []
    phase = 0.0
    smooth_noise = 0.0
    for index in range(round(duration * SAMPLE_RATE)):
        time = index / SAMPLE_RATE
        frequency = base + sweep * math.sin(math.pi * time / duration)
        phase += math.tau * frequency / SAMPLE_RATE
        smooth_noise = smooth_noise * .94 + rng.uniform(-1, 1) * .06
        carrier = math.sin(phase) + .32 * math.sin(phase * 2.01)
        modulation = .64 + .36 * math.sin(math.tau * pulse * time) ** 2
        samples.append((carrier * .32 + smooth_noise * .16) * modulation * envelope(time, duration))
    return samples


def loop_noise(duration: float, seed: int, low: float, high: float, waves=()):
    rng = random.Random(seed)
    samples = []
    smooth_a = smooth_b = 0.0
    count = round(duration * SAMPLE_RATE)
    for index in range(count):
        time = index / SAMPLE_RATE
        raw = rng.uniform(-1, 1)
        smooth_a = smooth_a * .975 + raw * .025
        smooth_b = smooth_b * .997 + raw * .003
        value = smooth_a * high + smooth_b * low
        for frequency, gain in waves:
            value += math.sin(math.tau * frequency * time) * gain
        edge = min(1, index / 600, (count - index - 1) / 600)
        samples.append(value * max(0, edge))
    return samples


def mix_tracks(base: list[float], track: list[float], start_seconds: float, gain: float):
    start = round(start_seconds * SAMPLE_RATE)
    for index, value in enumerate(track):
        target = start + index
        if target >= len(base):
            break
        base[target] += value * gain


def generate_sounds():
    calls = {
        "rabbit": (.24, 92, 25, 9), "deer": (.72, 145, -42, 4),
        "fox": (.38, 390, 150, 7), "squirrel": (.28, 680, 220, 18),
        "duck": (.42, 185, -55, 8), "cow": (1.05, 105, -35, 2),
        "chicken": (.33, 510, -80, 15), "dog": (.31, 330, -110, 6),
        "cat": (.62, 410, 180, 5), "frog": (.55, 92, -18, 28),
        "otter": (.31, 720, -260, 14), "boar": (.50, 88, -18, 5),
        "tahr": (.70, 230, 95, 6), "turtle": (.28, 130, -35, 4),
    }
    for index, (species, values) in enumerate(calls.items()):
        write_wave(ECOLOGY_SOUNDS / f"occ_{species}_call.wav", voice(*values, 100 + index))

    interactions = {
        "occ_animal_eat": (.28, 165, -60, 17, 501),
        "occ_animal_drink": (.36, 260, -120, 13, 502),
        "occ_animal_alert": (.22, 520, 170, 12, 503),
        "occ_hunt_pounce": (.30, 110, -55, 7, 504),
        "occ_companion_trust": (.55, 520, 220, 5, 505),
        "occ_robot_ready": (.28, 440, 220, 8, 506),
        "occ_robot_blocked": (.24, 155, -70, 5, 507),
        "occ_field_note": (.30, 620, 140, 7, 508),
    }
    for name, values in interactions.items():
        write_wave(ECOLOGY_SOUNDS / f"{name}.wav", voice(*values))

    forest = loop_noise(12, 710, .24, .10, ((83 / 12, .018), (127 / 12, .012)))
    for start, frequency in ((1.1, 970), (3.8, 1280), (7.2, 820), (9.6, 1460)):
        mix_tracks(forest, voice(.28, frequency, 210, 18, round(frequency)), start, .23)
    river = loop_noise(10, 711, .55, .28, ((7 / 10, .025), (13 / 10, .018)))
    rain = loop_noise(10, 712, .12, .52, ((11 / 10, .012),))
    wind = loop_noise(12, 713, .50, .12, ((3 / 12, .035), (7 / 12, .02)))
    coast = loop_noise(12, 714, .52, .25, ((2 / 12, .08), (4 / 12, .03)))
    write_wave(WORLD_SOUNDS / "openclasscraft_forest_ambience.wav", forest)
    write_wave(WORLD_SOUNDS / "openclasscraft_river_ambience.wav", river)
    write_wave(WORLD_SOUNDS / "openclasscraft_rain_ambience.wav", rain)
    write_wave(WORLD_SOUNDS / "openclasscraft_wind_ambience.wav", wind)
    write_wave(WORLD_SOUNDS / "openclasscraft_coast_ambience.wav", coast)


def main():
    TEXTURES.mkdir(parents=True, exist_ok=True)
    for species in SPECIES:
        for material in ("fur", "accent", "dark"):
            (TEXTURES / f"occ_{species}_{material}.png").write_bytes(material_texture(species, material))
        (TEXTURES / f"occ_spawn_{species}.png").write_bytes(spawn_icon(species))
    (TEXTURES / "occ_animal_eyes.png").write_bytes(eye_texture())
    generate_sounds()
    print(f"generated {len(SPECIES)} wildlife texture sets, portraits, calls, and ambient sound layers")


if __name__ == "__main__":
    main()
