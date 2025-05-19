import FreeCAD, Part, ImportGui, MeshPart, Mesh
import os

def convert_step_to_obj_with_parts(step_path, obj_path, linear_deflection=0.2, angular_deflection=10.0):
    """
    Convert a STEP file to an OBJ file with each part preserved as a separate object.
    """
    doc_name = "ExportParts"
    doc = FreeCAD.newDocument(doc_name)
    ImportGui.insert(step_path, doc_name)

    export_meshes = []

    for obj in doc.Objects:
        if not hasattr(obj, "Shape"):
            continue
        name = obj.Name

        mesh = MeshPart.meshFromShape(
            Shape=obj.Shape,
            LinearDeflection=linear_deflection,
            AngularDeflection=angular_deflection,
            Relative=False
        )

        mesh_obj = doc.addObject("Mesh::Feature", f"Mesh_{name}")
        mesh_obj.Mesh = mesh
        export_meshes.append(mesh_obj)

    if not export_meshes:
        raise RuntimeError(f"No valid meshable shapes found in {step_path}")

    Mesh.export(export_meshes, obj_path)
    print(f"✅ Exported {len(export_meshes)} mesh parts to {obj_path}")

    FreeCAD.closeDocument(doc.Name)


def batch_convert_folder(input_folder, output_folder, linear_deflection=0.2, angular_deflection=10.0):
    """
    Convert all .stp/.step files in a folder to OBJ with part-level separation.
    """
    for file in os.listdir(input_folder):
        if file.lower().endswith((".stp", ".step")):
            step_path = os.path.join(input_folder, file)
            obj_name = os.path.splitext(file)[0] + ".obj"
            obj_path = os.path.join(output_folder, obj_name)
            convert_step_to_obj_with_parts(step_path, obj_path, linear_deflection, angular_deflection)


# === USAGE ===
input_folder = "/full/path/to/your/folder_with_step_files"
output_folder = "/full/path/to/your/output_folder"

batch_convert_folder(input_folder, output_folder)