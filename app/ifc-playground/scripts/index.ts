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

# Get all entity types - safer check for schema structure
try:
    # Try different ways to get entity types depending on IfcOpenShell version
    if hasattr(ifc_file, "wrapped_data") and hasattr(ifc_file.wrapped_data, "schema"):
        if hasattr(ifc_file.wrapped_data.schema, "declarations"):
            # Modern IfcOpenShell version
            entity_types = ifc_file.wrapped_data.schema.declarations.keys()
        elif isinstance(ifc_file.wrapped_data.schema, str):
            # Older or different structure - just use basic types
            entity_types = ["IfcProduct", "IfcWall", "IfcWindow", "IfcDoor", "IfcSlab", "IfcBeam", "IfcColumn"]
    else:
        # Fallback to basic approach - just extract from products
        entity_types = ["IfcProduct"]
except Exception as e:
    print(f"Warning accessing schema: {e}")
    entity_types = ["IfcProduct"]  # Fallback to just IfcProduct

# Get a sample of products (limit to 100 for better coverage)
products = ifc_file.by_type("IfcProduct")[:100]

# Raw data structure
all_properties = {}

# Organized data structure
organized_properties = {
    "summary": {
        "total_elements": 0,
        "elements_with_properties": 0,
        "property_sets_count": 0
    },
    "element_types": {}
}

property_sets_count = 0
elements_with_properties = 0

for product in products:
    product_id = product.id()
    product_type = product.is_a()
    product_name = product.Name if hasattr(product, "Name") and product.Name else "Unnamed"
    
    property_sets = get_property_sets(product)
    
    product_properties = {}
    for pset in property_sets:
        pset_name = pset.Name
        props = extract_properties(pset)
        if props:
            product_properties[pset_name] = props
            property_sets_count += 1
    
    if product_properties:
        elements_with_properties += 1
        
        # Add to raw data structure
        all_properties[f"{product_type}#{product_id} ({product_name})"] = product_properties
        
        # Add to organized data structure
        if product_type not in organized_properties["element_types"]:
            organized_properties["element_types"][product_type] = {
                "count": 0,
                "elements": []
            }
        
        organized_properties["element_types"][product_type]["count"] += 1
        organized_properties["element_types"][product_type]["elements"].append({
            "id": product_id,
            "name": product_name,
            "property_sets": product_properties
        })

# Update summary
organized_properties["summary"]["total_elements"] = len(products)
organized_properties["summary"]["elements_with_properties"] = elements_with_properties
organized_properties["summary"]["property_sets_count"] = property_sets_count

# Sort element types by count
organized_properties["element_types"] = dict(sorted(
    organized_properties["element_types"].items(), 
    key=lambda x: x[1]["count"], 
    reverse=True
))

print(f"Extracted properties from {elements_with_properties} out of {len(products)} elements")
print(f"Found {property_sets_count} property sets across all elements")

# Add UI metadata to indicate that multiple views are available
results["__ui_metadata"] = {
    "has_multiple_views": True,
    "view_options": [
        {"id": "raw", "label": "Raw Data", "description": "Display raw property data by element"},
        {"id": "structured", "label": "Structured", "description": "Display properties organized by element types"}
    ],
    "default_view": "structured"
}

# Return both data structures
results["properties"] = all_properties  # Original format for backward compatibility
results["organized_properties"] = organized_properties  # New organized format
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

# Flat structure for raw view
flat_structure = []
def flatten_tree(node, parent_path=""):
    current_path = f"{parent_path}/{node['name']}" if parent_path else node['name']
    
    flat_structure.append({
        "id": node["id"],
        "type": node["type"],
        "name": node["name"],
        "level": node["level"],
        "path": current_path,
        "child_count": len(node["children"])
    })
    
    for child in node["children"]:
        flatten_tree(child, current_path)

flatten_tree(spatial_tree)

# Sort flat structure by level and then name
flat_structure.sort(key=lambda x: (x["level"], x["name"]))

print("Spatial structure levels:")
for level, count in level_counts.items():
    print(f"Level {level}: {count} elements")

# Add UI metadata to indicate that multiple views are available
results["__ui_metadata"] = {
    "has_multiple_views": True,
    "view_options": [
        {"id": "tree", "label": "Tree View", "description": "Display spatial structure as a hierarchical tree"},
        {"id": "raw", "label": "Flat View", "description": "Display spatial structure as a flat list"}
    ],
    "default_view": "tree"
}

results["spatial_tree"] = spatial_tree
results["level_counts"] = level_counts
results["flat_structure"] = flat_structure
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
                
                # Material profile set
                elif material.is_a("IfcMaterialProfileSet"):
                    for profile in material.MaterialProfiles:
                        if profile.Material:
                            materials.append({
                                "name": profile.Material.Name,
                                "type": "Profile",
                                "profile": profile.Profile.ProfileName if hasattr(profile.Profile, "ProfileName") else "Unknown"
                            })
                
                # Material constituent set
                elif material.is_a("IfcMaterialConstituentSet"):
                    for constituent in material.MaterialConstituents:
                        if constituent.Material:
                            materials.append({
                                "name": constituent.Material.Name,
                                "type": "Constituent",
                                "category": constituent.Category if hasattr(constituent, "Category") else None
                            })
                            
                # Material with profile
                elif material.is_a("IfcMaterialProfileSetUsage"):
                    profile_set = material.ForProfileSet
                    if profile_set:
                        for profile in profile_set.MaterialProfiles:
                            if profile.Material:
                                materials.append({
                                    "name": profile.Material.Name,
                                    "type": "ProfileUsage",
                                    "profile": profile.Profile.ProfileName if hasattr(profile.Profile, "ProfileName") else "Unknown"
                                })
                
                # Material with layer
                elif material.is_a("IfcMaterialLayerSetUsage"):
                    layer_set = material.ForLayerSet
                    if layer_set:
                        for layer in layer_set.MaterialLayers:
                            if layer.Material:
                                materials.append({
                                    "name": layer.Material.Name,
                                    "type": "LayerUsage",
                                    "thickness": layer.LayerThickness if hasattr(layer, "LayerThickness") else None
                                })
    
    return materials

# Get all products
products = ifc_file.by_type("IfcProduct")

# Collect materials
all_materials = {}
material_usage = {}

# Structured format for materials
organized_materials = {
    "summary": {
        "total_materials": 0,
        "total_products_with_materials": 0
    },
    "materials": {},
    "product_types": {}
}

products_with_materials = 0

for product in products:
    materials = get_material(product)
    
    if materials:
        products_with_materials += 1
        product_id = product.id()
        product_type = product.is_a()
        product_name = product.Name if hasattr(product, "Name") else "Unnamed"
        
        # Add to raw data structure
        all_materials[f"{product_type}#{product_id} ({product_name})"] = materials
        
        # Add to organized structure - group by product type
        if product_type not in organized_materials["product_types"]:
            organized_materials["product_types"][product_type] = {
                "count": 0,
                "elements": []
            }
        
        organized_materials["product_types"][product_type]["count"] += 1
        organized_materials["product_types"][product_type]["elements"].append({
            "id": product_id,
            "name": product_name,
            "materials": materials
        })
        
        # Count material usage
        for mat in materials:
            mat_name = mat["name"]
            
            # Add to simple count
            if mat_name in material_usage:
                material_usage[mat_name] += 1
            else:
                material_usage[mat_name] = 1
            
            # Add to organized structure
            if mat_name not in organized_materials["materials"]:
                organized_materials["materials"][mat_name] = {
                    "count": 0,
                    "types": [],
                    "usage": {}
                }
            
            organized_materials["materials"][mat_name]["count"] += 1
            
            if product_type not in organized_materials["materials"][mat_name]["usage"]:
                organized_materials["materials"][mat_name]["usage"][product_type] = 0
                organized_materials["materials"][mat_name]["types"].append(product_type)
            
            organized_materials["materials"][mat_name]["usage"][product_type] += 1

# Sort materials by usage
sorted_materials = dict(sorted(material_usage.items(), key=lambda x: x[1], reverse=True))

# Sort organized materials by count
organized_materials["materials"] = dict(sorted(
    organized_materials["materials"].items(),
    key=lambda x: x[1]["count"],
    reverse=True
))

# Sort product types by count
organized_materials["product_types"] = dict(sorted(
    organized_materials["product_types"].items(),
    key=lambda x: x[1]["count"],
    reverse=True
))

# Update summary
organized_materials["summary"]["total_materials"] = len(material_usage)
organized_materials["summary"]["total_products_with_materials"] = products_with_materials

print(f"Found {len(material_usage)} unique materials")
print(f"Found {products_with_materials} products with materials")
print("Top 10 most used materials:")
for i, (mat_name, count) in enumerate(list(sorted_materials.items())[:10]):
    print(f"{mat_name}: {count} usages")

# Add UI metadata to indicate that multiple views are available
results["__ui_metadata"] = {
    "has_multiple_views": True,
    "view_options": [
        {"id": "structured", "label": "Structured", "description": "Display materials organized by usage"},
        {"id": "raw", "label": "Raw Data", "description": "Display raw material data by element"}
    ],
    "default_view": "structured"
}

results["material_usage"] = sorted_materials
results["product_materials"] = all_materials
results["organized_materials"] = organized_materials
`,
};

export type ScriptKey = keyof typeof SCRIPTS;
