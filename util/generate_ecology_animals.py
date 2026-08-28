#!/usr/bin/env python3
"""Generate the rigged GLB wildlife models shipped with OpenClassCraft.

The meshes intentionally use a small number of cuboids so they remain readable in
the voxel world and inexpensive on classroom hardware.  The generated glTF files
contain one timeline with stable ranges for idle, walking, running, sitting, and
grazing animations.  Re-run this script after changing proportions or animation
poses; it has no third-party Python dependencies.
"""

from __future__ import annotations

import json
import math
import pathlib
import struct


ROOT = pathlib.Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "games/luanti_edu/mods/openclasscraft_ecology/models"

MATERIALS = ("fur", "accent", "dark", "detail")
MATERIAL_COLORS = {
    "fur": (1.0, 1.0, 1.0, 1.0),
    "accent": (0.995, 1.0, 1.0, 1.0),
    "dark": (1.0, 0.995, 1.0, 1.0),
    "detail": (1.0, 1.0, 0.995, 1.0),
}
ANIMATION_RANGES = {
    "idle": (0.0, 1.9),
    "walk": (2.0, 3.0),
    "run": (3.1, 4.1),
    "sit": (4.2, 5.2),
    "graze": (5.3, 6.7),
}


def quaternion(axis: str, degrees: float) -> tuple[float, float, float, float]:
    angle = math.radians(degrees) / 2
    sine = math.sin(angle)
    axes = {
        "x": (sine, 0.0, 0.0),
        "y": (0.0, sine, 0.0),
        "z": (0.0, 0.0, sine),
    }
    x, y, z = axes[axis]
    return (x, y, z, math.cos(angle))


def rotate_xyz(point, angles):
    x, y, z = point
    rx, ry, rz = (math.radians(value) for value in angles)
    y, z = y * math.cos(rx) - z * math.sin(rx), y * math.sin(rx) + z * math.cos(rx)
    x, z = x * math.cos(ry) + z * math.sin(ry), -x * math.sin(ry) + z * math.cos(ry)
    x, y = x * math.cos(rz) - y * math.sin(rz), x * math.sin(rz) + y * math.cos(rz)
    return x, y, z


class BinaryDocument:
    def __init__(self):
        self.data = bytearray()
        self.views = []
        self.accessors = []

    def add_view(self, payload: bytes, target=None) -> int:
        while len(self.data) % 4:
            self.data.append(0)
        offset = len(self.data)
        self.data.extend(payload)
        view = {"buffer": 0, "byteOffset": offset, "byteLength": len(payload)}
        if target:
            view["target"] = target
        self.views.append(view)
        return len(self.views) - 1

    def add_accessor(self, values, component_type, value_type, pack_code,
                     *, target=None, minimum=None, maximum=None) -> int:
        flat = []
        for value in values:
            if isinstance(value, (tuple, list)):
                flat.extend(value)
            else:
                flat.append(value)
        payload = struct.pack("<" + pack_code * len(flat), *flat)
        view = self.add_view(payload, target)
        accessor = {
            "bufferView": view,
            "componentType": component_type,
            "count": len(values),
            "type": value_type,
        }
        if minimum is not None:
            accessor["min"] = list(minimum)
        if maximum is not None:
            accessor["max"] = list(maximum)
        self.accessors.append(accessor)
        return len(self.accessors) - 1


class MeshBuilder:
    def __init__(self, bone_indices):
        self.bone_indices = bone_indices
        self.positions = []
        self.normals = []
        self.uvs = []
        self.joints = []
        self.weights = []
        self.indices = [[] for _ in MATERIALS]

    def add_box(self, center, size, bone, material="fur", rotation=(0, 0, 0)):
        cx, cy, cz = center
        hx, hy, hz = (value / 2 for value in size)
        faces = (
            ((-1, -1, 1), (1, -1, 1), (1, 1, 1), (-1, 1, 1), (0, 0, 1)),
            ((1, -1, -1), (-1, -1, -1), (-1, 1, -1), (1, 1, -1), (0, 0, -1)),
            ((1, -1, 1), (1, -1, -1), (1, 1, -1), (1, 1, 1), (1, 0, 0)),
            ((-1, -1, -1), (-1, -1, 1), (-1, 1, 1), (-1, 1, -1), (-1, 0, 0)),
            ((-1, 1, 1), (1, 1, 1), (1, 1, -1), (-1, 1, -1), (0, 1, 0)),
            ((-1, -1, -1), (1, -1, -1), (1, -1, 1), (-1, -1, 1), (0, -1, 0)),
        )
        material_index = MATERIALS.index(material)
        joint = self.bone_indices[bone]
        for face in faces:
            start = len(self.positions)
            for corner, uv in zip(face[:4], ((0, 1), (1, 1), (1, 0), (0, 0))):
                local = (corner[0] * hx, corner[1] * hy, corner[2] * hz)
                px, py, pz = rotate_xyz(local, rotation)
                nx, ny, nz = rotate_xyz(face[4], rotation)
                self.positions.append((cx + px, cy + py, cz + pz))
                self.normals.append((nx, ny, nz))
                self.uvs.append(uv)
                self.joints.append((joint, 0, 0, 0))
                self.weights.append((1.0, 0.0, 0.0, 0.0))
            self.indices[material_index].extend((start, start + 1, start + 2,
                                                 start, start + 2, start + 3))


def animal_definition(kind):
    if kind == "rabbit":
        bones = {
            "body": (0, 0.55, 0), "head": (0, 0.9, 0.48),
            "ear_l": (-0.16, 1.14, 0.48), "ear_r": (0.16, 1.14, 0.48),
            "leg_fl": (-0.23, 0.38, 0.30), "leg_fr": (0.23, 0.38, 0.30),
            "leg_bl": (-0.28, 0.40, -0.30), "leg_br": (0.28, 0.40, -0.30),
            "tail": (0, 0.60, -0.53),
        }
        parts = (
            ("body", (0, .57, -.02), (.70, .58, .90), "fur", (0, 0, 0)),
            ("body", (0, .70, .26), (.58, .54, .45), "accent", (0, 0, 0)),
            ("head", (0, .90, .57), (.55, .50, .52), "fur", (0, 0, 0)),
            ("head", (0, .80, .88), (.38, .25, .22), "accent", (0, 0, 0)),
            ("head", (0, .82, 1.01), (.12, .10, .08), "dark", (0, 0, 0)),
            ("head", (-.23, .96, .80), (.07, .09, .07), "detail", (0, 0, 0)),
            ("head", (.23, .96, .80), (.07, .09, .07), "detail", (0, 0, 0)),
            ("ear_l", (-.16, 1.31, .50), (.16, .56, .17), "fur", (-4, 0, -5)),
            ("ear_r", (.16, 1.31, .50), (.16, .56, .17), "fur", (-4, 0, 5)),
            ("ear_l", (-.16, 1.32, .59), (.07, .38, .03), "accent", (-4, 0, -5)),
            ("ear_r", (.16, 1.32, .59), (.07, .38, .03), "accent", (-4, 0, 5)),
            ("leg_fl", (-.23, .22, .34), (.18, .38, .20), "accent", (0, 0, 0)),
            ("leg_fr", (.23, .22, .34), (.18, .38, .20), "accent", (0, 0, 0)),
            ("leg_bl", (-.29, .25, -.31), (.27, .42, .38), "fur", (0, 0, 0)),
            ("leg_br", (.29, .25, -.31), (.27, .42, .38), "fur", (0, 0, 0)),
            ("tail", (0, .61, -.58), (.34, .34, .30), "accent", (0, 0, 0)),
        )
    elif kind == "deer":
        bones = {
            "body": (0, 1.12, 0), "neck": (0, 1.35, .57),
            "head": (0, 1.73, .82), "ear_l": (-.24, 1.94, .78),
            "ear_r": (.24, 1.94, .78), "leg_fl": (-.30, .92, .48),
            "leg_fr": (.30, .92, .48), "leg_bl": (-.30, .92, -.48),
            "leg_br": (.30, .92, -.48), "tail": (0, 1.30, -.82),
        }
        parts = (
            ("body", (0, 1.20, -.05), (.82, .72, 1.48), "fur", (0, 0, 0)),
            ("body", (0, 1.04, .30), (.66, .34, .52), "accent", (0, 0, 0)),
            ("neck", (0, 1.48, .57), (.48, .90, .45), "fur", (-16, 0, 0)),
            ("head", (0, 1.76, .88), (.52, .48, .60), "fur", (0, 0, 0)),
            ("head", (0, 1.66, 1.22), (.42, .25, .30), "accent", (0, 0, 0)),
            ("head", (0, 1.69, 1.39), (.25, .15, .08), "dark", (0, 0, 0)),
            ("head", (-.23, 1.84, 1.08), (.07, .09, .07), "detail", (0, 0, 0)),
            ("head", (.23, 1.84, 1.08), (.07, .09, .07), "detail", (0, 0, 0)),
            ("ear_l", (-.31, 2.01, .82), (.30, .16, .22), "accent", (0, -12, -18)),
            ("ear_r", (.31, 2.01, .82), (.30, .16, .22), "accent", (0, 12, 18)),
            ("head", (-.16, 2.13, .72), (.07, .42, .07), "dark", (0, 0, -7)),
            ("head", (.16, 2.13, .72), (.07, .42, .07), "dark", (0, 0, 7)),
            ("head", (-.28, 2.25, .72), (.25, .06, .06), "dark", (0, 0, -18)),
            ("head", (.28, 2.25, .72), (.25, .06, .06), "dark", (0, 0, 18)),
            ("leg_fl", (-.30, .48, .48), (.18, .92, .20), "fur", (0, 0, 0)),
            ("leg_fr", (.30, .48, .48), (.18, .92, .20), "fur", (0, 0, 0)),
            ("leg_bl", (-.30, .48, -.48), (.18, .92, .20), "fur", (0, 0, 0)),
            ("leg_br", (.30, .48, -.48), (.18, .92, .20), "fur", (0, 0, 0)),
            ("leg_fl", (-.30, .08, .53), (.20, .16, .28), "dark", (0, 0, 0)),
            ("leg_fr", (.30, .08, .53), (.20, .16, .28), "dark", (0, 0, 0)),
            ("leg_bl", (-.30, .08, -.43), (.20, .16, .28), "dark", (0, 0, 0)),
            ("leg_br", (.30, .08, -.43), (.20, .16, .28), "dark", (0, 0, 0)),
            ("tail", (0, 1.37, -.86), (.24, .42, .22), "accent", (-28, 0, 0)),
        )
    else:
        bones = {
            "body": (0, .67, 0), "head": (0, .83, .67),
            "ear_l": (-.20, 1.08, .66), "ear_r": (.20, 1.08, .66),
            "leg_fl": (-.26, .48, .42), "leg_fr": (.26, .48, .42),
            "leg_bl": (-.26, .48, -.42), "leg_br": (.26, .48, -.42),
            "tail": (0, .75, -.69),
        }
        parts = (
            ("body", (0, .72, -.03), (.74, .60, 1.28), "fur", (0, 0, 0)),
            ("body", (0, .60, .36), (.58, .30, .45), "accent", (0, 0, 0)),
            ("head", (0, .88, .74), (.58, .52, .55), "fur", (0, 0, 0)),
            ("head", (0, .78, 1.07), (.42, .27, .34), "accent", (0, 0, 0)),
            ("head", (0, .80, 1.27), (.17, .13, .10), "dark", (0, 0, 0)),
            ("head", (-.24, .96, .96), (.07, .10, .07), "detail", (0, 0, 0)),
            ("head", (.24, .96, .96), (.07, .10, .07), "detail", (0, 0, 0)),
            ("ear_l", (-.20, 1.17, .67), (.23, .45, .18), "fur", (-4, 0, -8)),
            ("ear_r", (.20, 1.17, .67), (.23, .45, .18), "fur", (-4, 0, 8)),
            ("ear_l", (-.20, 1.16, .77), (.10, .28, .03), "dark", (-4, 0, -8)),
            ("ear_r", (.20, 1.16, .77), (.10, .28, .03), "dark", (-4, 0, 8)),
            ("leg_fl", (-.26, .24, .42), (.17, .52, .20), "dark", (0, 0, 0)),
            ("leg_fr", (.26, .24, .42), (.17, .52, .20), "dark", (0, 0, 0)),
            ("leg_bl", (-.26, .24, -.42), (.17, .52, .20), "dark", (0, 0, 0)),
            ("leg_br", (.26, .24, -.42), (.17, .52, .20), "dark", (0, 0, 0)),
            ("tail", (0, .76, -.91), (.40, .38, .90), "fur", (-20, 0, 0)),
            ("tail", (0, .62, -1.30), (.34, .32, .34), "accent", (-20, 0, 0)),
        )
    return bones, parts


def animation_angle(kind, bone, time):
    if 0 <= time <= 1.9:
        phase = time / 1.9 * math.tau
        if bone == "head":
            return "x", math.sin(phase) * 2
        if bone == "ear_l":
            return "z", math.sin(phase) * 5
        if bone == "ear_r":
            return "z", -math.sin(phase) * 3
        if bone == "tail":
            return "y", math.sin(phase) * (7 if kind == "fox" else 3)
    elif 2 <= time <= 3:
        phase = (time - 2) * math.tau
        if bone.startswith("leg_"):
            first_pair = bone in ("leg_fl", "leg_br")
            return "x", math.sin(phase) * (26 if first_pair else -26)
        if bone == "head":
            return "x", math.sin(phase * 2) * 3
        if bone == "tail":
            return "y", math.sin(phase * 2) * (12 if kind == "fox" else 5)
    elif 3.1 <= time <= 4.1:
        phase = (time - 3.1) * math.tau
        if bone.startswith("leg_"):
            first_pair = bone in ("leg_fl", "leg_br")
            amount = 34 if kind != "rabbit" else 42
            return "x", math.sin(phase) * (amount if first_pair else -amount)
        if bone == "head":
            return "x", -5 + math.sin(phase * 2) * 4
        if bone == "tail":
            return "y", math.sin(phase * 2) * (18 if kind == "fox" else 7)
    elif 4.2 <= time <= 5.2:
        if bone in ("leg_bl", "leg_br"):
            return "x", -38 if kind != "deer" else -18
        if bone in ("leg_fl", "leg_fr"):
            return "x", 10
        if bone == "head":
            return "x", 4
        if bone == "tail" and kind == "fox":
            return "y", 24
    elif 5.3 <= time <= 6.7:
        phase = (time - 5.3) / 1.4 * math.tau
        if bone == "head":
            return "x", 38 + math.sin(phase) * 8
        if bone == "neck":
            return "x", 18 + math.sin(phase) * 5
        if bone == "tail":
            return "y", math.sin(phase) * 4
    return "x", 0


def generate(kind):
    bones, parts = animal_definition(kind)
    bone_names = list(bones)
    bone_indices = {name: index for index, name in enumerate(bone_names)}
    mesh = MeshBuilder(bone_indices)
    for bone, center, size, material, rotation in parts:
        mesh.add_box(center, size, bone, material, rotation)

    binary = BinaryDocument()
    mins = tuple(min(values) for values in zip(*mesh.positions))
    maxs = tuple(max(values) for values in zip(*mesh.positions))
    positions = binary.add_accessor(mesh.positions, 5126, "VEC3", "f", target=34962,
                                    minimum=mins, maximum=maxs)
    normals = binary.add_accessor(mesh.normals, 5126, "VEC3", "f", target=34962)
    uvs = binary.add_accessor(mesh.uvs, 5126, "VEC2", "f", target=34962)
    joints = binary.add_accessor(mesh.joints, 5123, "VEC4", "H", target=34962)
    weights = binary.add_accessor(mesh.weights, 5126, "VEC4", "f", target=34962)

    primitives = []
    for material, indices in enumerate(mesh.indices):
        accessor = binary.add_accessor(indices, 5123, "SCALAR", "H", target=34963,
                                       minimum=(min(indices),), maximum=(max(indices),))
        primitives.append({
            "attributes": {
                "POSITION": positions, "NORMAL": normals, "TEXCOORD_0": uvs,
                "JOINTS_0": joints, "WEIGHTS_0": weights,
            },
            "indices": accessor,
            "material": material,
        })

    inverse_matrices = []
    for name in bone_names:
        x, y, z = bones[name]
        inverse_matrices.append((1, 0, 0, 0, 0, 1, 0, 0,
                                 0, 0, 1, 0, -x, -y, -z, 1))
    inverse_accessor = binary.add_accessor(inverse_matrices, 5126, "MAT4", "f")

    times = (0, .475, .95, 1.425, 1.9,
             2, 2.25, 2.5, 2.75, 3,
             3.1, 3.35, 3.6, 3.85, 4.1,
             4.2, 4.45, 4.7, 4.95, 5.2,
             5.3, 5.65, 6.0, 6.35, 6.7)
    time_accessor = binary.add_accessor(times, 5126, "SCALAR", "f",
                                        minimum=(min(times),), maximum=(max(times),))

    nodes = [{"name": f"{kind}_skeleton", "children": list(range(1, len(bones) + 1))}]
    for name in bone_names:
        nodes.append({"name": name, "translation": list(bones[name])})
    mesh_node = len(nodes)
    nodes.append({"name": f"{kind}_mesh", "mesh": 0, "skin": 0})

    samplers = []
    channels = []
    for index, name in enumerate(bone_names):
        rotations = [quaternion(*animation_angle(kind, name, time)) for time in times]
        output = binary.add_accessor(rotations, 5126, "VEC4", "f")
        samplers.append({"input": time_accessor, "output": output, "interpolation": "LINEAR"})
        channels.append({"sampler": len(samplers) - 1,
                         "target": {"node": index + 1, "path": "rotation"}})

    document = {
        "asset": {"version": "2.0", "generator": "OpenClassCraft animal generator"},
        "scene": 0,
        "scenes": [{"nodes": [0, mesh_node]}],
        "nodes": nodes,
        "meshes": [{"name": f"{kind}_mesh", "primitives": primitives}],
        "skins": [{"name": f"{kind}_rig", "inverseBindMatrices": inverse_accessor,
                   "skeleton": 0, "joints": list(range(1, len(bones) + 1))}],
        "animations": [{"name": "wildlife", "samplers": samplers, "channels": channels}],
        "materials": [{
            "name": name,
            "pbrMetallicRoughness": {
                "baseColorFactor": MATERIAL_COLORS[name],
                "metallicFactor": 0,
                "roughnessFactor": 1,
            },
        } for name in MATERIALS],
        "buffers": [{"byteLength": len(binary.data)}],
        "bufferViews": binary.views,
        "accessors": binary.accessors,
    }

    json_data = json.dumps(document, separators=(",", ":")).encode("utf-8")
    json_data += b" " * ((4 - len(json_data) % 4) % 4)
    binary_data = bytes(binary.data)
    binary_data += b"\0" * ((4 - len(binary_data) % 4) % 4)
    total_length = 12 + 8 + len(json_data) + 8 + len(binary_data)
    glb = (struct.pack("<4sII", b"glTF", 2, total_length)
           + struct.pack("<I4s", len(json_data), b"JSON") + json_data
           + struct.pack("<I4s", len(binary_data), b"BIN\0") + binary_data)

    OUTPUT.mkdir(parents=True, exist_ok=True)
    (OUTPUT / f"occ_{kind}.glb").write_bytes(glb)
    print(f"generated {kind}: {len(mesh.positions)} vertices, "
          f"{sum(len(value) for value in mesh.indices) // 3} triangles")


if __name__ == "__main__":
    for animal in ("rabbit", "deer", "fox"):
        generate(animal)
