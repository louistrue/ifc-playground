export const SCRIPTS = {
  "extract-geometry": `
# Extract geometry from IFC file
print("Extracting geometry from IFC file...")

# Get all products with geometry
products = ifc_file.by_type("IfcProduct")
products_with_geometry = [p for p in products if p.Representation is not None]

# Extract basic geometry information
geometry_data = []
for product in products_with_geometry[:100]:  # Limit to first 100 for performance
    try:
        product_data = {
            "id": product.id(),
            "type": product.is_a(),
            "name": product.Name if hasattr(product, "Name") else "Unnamed",
            "guid": product.GlobalId,
        }
        geometry_data.append(product_data)
    except Exception as e:
        print(f"Error processing {product.is_a()} #{product.id()}: {str(e)}")

print(f"Extracted geometry data for {len(geometry_data)} products")
results["geometry"] = geometry_data
results["product_count"] = len(products_with_geometry)
`,

  "count-elements": `
# Count elements by type
try:
    print("Counting elements by type...")

    # Get all entity types
    entity_types = ifc_file.wrapped_data.schema.declarations.keys()

    # Count instances of each type
    type_counts = {}
    for entity_type in entity_types:
        instances = ifc_file.by_type(entity_type)
        if instances:
            type_counts[entity_type] = len(instances)

    # Sort by count (descending)
    sorted_counts = dict(sorted(type_counts.items(), key=lambda x: x[1], reverse=True))

    # Print the top 20 most common types
    print("Top 20 most common element types:")
    for i, (entity_type, count) in enumerate(list(sorted_counts.items())[:20]):
        print(f"{entity_type}: {count}")

    results["type_counts"] = sorted_counts
except Exception as e:
    print(f"Error: {e}")
    results["error"] = str(e)
`,

  "extract-properties": `
# Extract properties from elements
print("Extracting properties from elements...")

def get_property_sets(product):
    property_sets = []
    
    # Get property sets directly assigned to the product
    if hasattr(product, "IsDefinedBy"):
        for definition in product.IsDefinedBy:
            if definition.is_a("IfcRelDefinesByProperties"):
                property_set = definition.RelatingPropertyDefinition
                if property_set.is_a("IfcPropertySet"):
                    property_sets.append(property_set)
    
    return property_sets

def extract_properties(property_set):
    properties = {}
    
    if hasattr(property_set, "HasProperties"):
        for prop in property_set.HasProperties:
            if prop.is_a("IfcPropertySingleValue") and prop.NominalValue:
                prop_name = prop.Name
                prop_value = prop.NominalValue.wrappedValue
                properties[prop_name] = prop_value
    
    return properties

# Get a sample of products (limit to 50 for performance)
products = ifc_file.by_type("IfcProduct")[:50]

all_properties = {}
for product in products:
    product_id = product.id()
    product_type = product.is_a()
    product_name = product.Name if hasattr(product, "Name") else "Unnamed"
    
    property_sets = get_property_sets(product)
    
    product_properties = {}
    for pset in property_sets:
        pset_name = pset.Name
        props = extract_properties(pset)
        if props:
            product_properties[pset_name] = props
    
    if product_properties:
        all_properties[f"{product_type}#{product_id} ({product_name})"] = product_properties

print(f"Extracted properties from {len(all_properties)} elements")
results["properties"] = all_properties
`,

  "spatial-structure": `
# Analyze spatial structure
print("Analyzing spatial structure...")

def get_children(parent):
    children = []
    
    # Get spatial decomposition
    if hasattr(parent, "IsDecomposedBy"):
        for decomposition in parent.IsDecomposedBy:
            children.extend(decomposition.RelatedObjects)
    
    # Get contained elements
    if hasattr(parent, "ContainsElements"):
        for rel in parent.ContainsElements:
            children.extend(rel.RelatedElements)
    
    return children

def build_spatial_tree(element, level=0):
    element_info = {
        "id": element.id(),
        "type": element.is_a(),
        "name": element.Name if hasattr(element, "Name") else "Unnamed",
        "level": level,
        "children": []
    }
    
    children = get_children(element)
    for child in children:
        child_info = build_spatial_tree(child, level + 1)
        element_info["children"].append(child_info)
    
    return element_info

# Get the project
project = ifc_file.by_type("IfcProject")[0]
spatial_tree = build_spatial_tree(project)

# Count elements at each level
level_counts = {}
def count_levels(node):
    level = node["level"]
    level_counts[level] = level_counts.get(level, 0) + 1
    
    for child in node["children"]:
        count_levels(child)

count_levels(spatial_tree)

print("Spatial structure levels:")
for level, count in level_counts.items():
    print(f"Level {level}: {count} elements")

results["spatial_tree"] = spatial_tree
results["level_counts"] = level_counts
`,

  "material-analysis": `
# Extract and analyze materials
print("Analyzing materials...")

def get_material(product):
    materials = []
    
    # Check for material associations
    if hasattr(product, "HasAssociations"):
        for association in product.HasAssociations:
            if association.is_a("IfcRelAssociatesMaterial"):
                material = association.RelatingMaterial
                
                # Single material
                if material.is_a("IfcMaterial"):
                    materials.append({
                        "name": material.Name,
                        "type": "Single"
                    })
                
                # Material list
                elif material.is_a("IfcMaterialList"):
                    for mat in material.Materials:
                        materials.append({
                            "name": mat.Name,
                            "type": "List"
                        })
                
                # Material layer set
                elif material.is_a("IfcMaterialLayerSet"):
                    for layer in material.MaterialLayers:
                        if layer.Material:
                            materials.append({
                                "name": layer.Material.Name,
                                "type": "Layer",
                                "thickness": layer.LayerThickness if hasattr(layer, "LayerThickness") else None
                            })
    
    return materials

# Get all products
products = ifc_file.by_type("IfcProduct")

# Collect materials
all_materials = {}
material_usage = {}

for product in products:
    materials = get_material(product)
    
    if materials:
        product_id = product.id()
        product_type = product.is_a()
        product_name = product.Name if hasattr(product, "Name") else "Unnamed"
        
        all_materials[f"{product_type}#{product_id} ({product_name})"] = materials
        
        # Count material usage
        for mat in materials:
            mat_name = mat["name"]
            if mat_name in material_usage:
                material_usage[mat_name] += 1
            else:
                material_usage[mat_name] = 1

# Sort materials by usage
sorted_materials = dict(sorted(material_usage.items(), key=lambda x: x[1], reverse=True))

print(f"Found {len(material_usage)} unique materials")
print("Top 10 most used materials:")
for i, (mat_name, count) in enumerate(list(sorted_materials.items())[:10]):
    print(f"{mat_name}: {count} usages")

results["material_usage"] = sorted_materials
results["product_materials"] = all_materials
`,
};

export type ScriptKey = keyof typeof SCRIPTS;
