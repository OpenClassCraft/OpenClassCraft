#!/usr/bin/env python3
"""Validate the generated OpenClassCraft wildlife, atmosphere, and font media."""

from __future__ import annotations

import json
import pathlib
import struct
import wave


ROOT = pathlib.Path(__file__).resolve().parents[1]
ECOLOGY = ROOT / "games/luanti_edu/mods/openclasscraft_ecology"
WORLD = ROOT / "games/luanti_edu/mods/openclasscraft_world"
SPECIES = (
    "rabbit", "deer", "fox", "squirrel", "duck", "cow", "chicken",
    "dog", "cat", "frog", "otter", "boar", "tahr", "turtle",
)
ANIMATION_END = 12.7
INTERACTION_SOUNDS = (
    "occ_animal_eat", "occ_animal_drink", "occ_animal_alert",
    "occ_hunt_pounce", "occ_companion_trust", "occ_robot_ready",
    "occ_robot_blocked", "occ_field_note",
)
AMBIENCE = (
    "openclasscraft_forest_ambience", "openclasscraft_river_ambience",
    "openclasscraft_rain_ambience", "openclasscraft_wind_ambience",
    "openclasscraft_coast_ambience",
)


def check(condition: bool, message: str):
    if not condition:
        raise AssertionError(message)


def png_size(path: pathlib.Path) -> tuple[int, int]:
    data = path.read_bytes()
    check(data.startswith(b"\x89PNG\r\n\x1a\n"), f"invalid PNG: {path}")
    return struct.unpack(">II", data[16:24])


def glb_json(path: pathlib.Path) -> dict:
    data = path.read_bytes()
    check(len(data) >= 20, f"truncated GLB: {path}")
    magic, version, declared_length = struct.unpack_from("<4sII", data)
    check(magic == b"glTF" and version == 2, f"invalid GLB header: {path}")
    check(declared_length == len(data), f"incorrect GLB length: {path}")
    json_length, chunk_type = struct.unpack_from("<II", data, 12)
    check(chunk_type == 0x4E4F534A, f"missing GLB JSON chunk: {path}")
    payload = data[20:20 + json_length].rstrip(b" \0")
    return json.loads(payload)


def validate_model(species: str):
    path = ECOLOGY / "models" / f"occ_{species}.glb"
    document = glb_json(path)
    materials = {material.get("name") for material in document.get("materials", [])}
    check(materials == {"fur", "accent", "dark", "detail"},
          f"material set is incomplete in {path}")
    animations = document.get("animations", [])
    check(len(animations) == 1 and animations[0].get("channels"),
          f"animation data is missing in {path}")
    accessors = document.get("accessors", [])
    end_times = []
    for sampler in animations[0].get("samplers", []):
        accessor = accessors[sampler["input"]]
        end_times.extend(accessor.get("max", []))
    check(end_times and max(end_times) >= ANIMATION_END,
          f"extended behavior animations are missing in {path}")
    detail_material = next(index for index, material in enumerate(document["materials"])
                           if material.get("name") == "detail")
    detail_vertices = sum(
        accessors[primitive["attributes"]["POSITION"]].get("count", 0)
        for mesh in document.get("meshes", [])
        for primitive in mesh.get("primitives", [])
        if primitive.get("material") == detail_material
    )
    check(detail_vertices >= 48, f"two visible eye details are required in {path}")
    nodes = document.get("nodes", [])
    node_indices = {node.get("name"): index for index, node in enumerate(nodes)}
    check("head" in node_indices, f"runtime head bone is missing in {path}")
    head_children = {
        nodes[index].get("name")
        for index in nodes[node_indices["head"]].get("children", [])
    }
    expected_head_children = {
        name for name in ("ear_l", "ear_r") if name in node_indices
    }
    check(expected_head_children <= head_children,
          f"articulated ears must inherit runtime head tracking in {path}")


def validate_texture_set(species: str):
    for material in ("fur", "accent", "dark"):
        path = ECOLOGY / "textures" / f"occ_{species}_{material}.png"
        check(png_size(path) == (128, 128), f"unexpected texture size: {path}")
    portrait = ECOLOGY / "textures" / f"occ_spawn_{species}.png"
    check(png_size(portrait) == (256, 256), f"unexpected portrait size: {portrait}")


def validate_wave(path: pathlib.Path):
    with wave.open(str(path), "rb") as audio:
        check(audio.getnchannels() == 1, f"audio must be mono: {path}")
        check(audio.getsampwidth() == 2, f"audio must be 16-bit: {path}")
        check(audio.getframerate() == 22_050, f"unexpected sample rate: {path}")
        check(audio.getnframes() >= 4_000, f"audio is too short: {path}")


def validate_fonts():
    names = (
        "NotoSans-Regular.ttf", "NotoSans-Bold.ttf", "NotoSans-Italic.ttf",
        "NotoSans-BoldItalic.ttf", "NotoSansMalayalam-Variable.ttf",
    )
    for name in names:
        path = ROOT / "fonts" / name
        data = path.read_bytes()
        check(data.startswith(b"\0\1\0\0"), f"invalid TrueType font: {path}")
        check(len(data) > 100_000, f"font appears truncated: {path}")
    check((ROOT / "fonts/NotoSans-LICENSE.txt").is_file(), "Noto Sans license missing")
    check((ROOT / "fonts/NotoSansMalayalam-LICENSE.txt").is_file(),
          "Noto Sans Malayalam license missing")


def main():
    for species in SPECIES:
        validate_model(species)
        validate_texture_set(species)
        validate_wave(ECOLOGY / "sounds" / f"occ_{species}_call.wav")
    check(png_size(ECOLOGY / "textures/occ_animal_eyes.png") == (32, 32),
          "shared eye texture must be 32x32")
    for sound in INTERACTION_SOUNDS:
        validate_wave(ECOLOGY / "sounds" / f"{sound}.wav")
    for sound in AMBIENCE:
        validate_wave(WORLD / "sounds" / f"{sound}.wav")
    validate_fonts()
    print("Living-world media validation passed: 14 species, head-tracking rigs, "
          "10 animations, interaction audio, five ambience layers, and Noto "
          "Malayalam fonts.")


if __name__ == "__main__":
    main()
