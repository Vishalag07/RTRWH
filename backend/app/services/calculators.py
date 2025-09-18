from typing import Literal


def estimate_runoff_liters(annual_rainfall_mm: float, roof_area_m2: float, runoff_coefficient: float) -> float:
    """
    Hydrology note:
    - Rainfall depth (mm) over area (m^2) gives volume in liters: 1 mm over 1 m^2 = 1 liter.
    - Runoff coefficient accounts for losses (evaporation, initial abstraction, leakage) on rooftops.
      Typical for RCC roof: 0.8–0.9; tiled roof: 0.7–0.8. We'll allow caller to pick based on material.
    """
    return annual_rainfall_mm * roof_area_m2 * runoff_coefficient


def recommend_structure_type(roof_area_m2: float, open_space_area_m2: float, gw_depth_m: float) -> Literal["pit", "trench", "shaft", "recharge_well"]:
    """
    Simple rule-based recommendation:
    - If groundwater is shallow (<5 m) and space available: prefer recharge trench to spread recharge.
    - If space is limited but roof area is moderate: prefer recharge pit/shaft.
    - For large roof area (>300 m2) and sufficient depth to water table (>10 m): consider recharge well.
    """
    if gw_depth_m < 5 and open_space_area_m2 >= 20:
        return "trench"
    if roof_area_m2 < 120:
        return "pit"
    if roof_area_m2 >= 300 and gw_depth_m >= 10:
        return "recharge_well"
    return "shaft"


def suggest_dimensions(structure_type: str, target_storage_liters: float) -> tuple[dict, float, str]:
    """
    Suggest simple parametric dimensions that approximate the target storage.
    - pit: cuboid L x B x D; volume = L*B*D; assume 40% voids if filled with pebbles → effective storage = 0.4 * volume(m3) * 1000
    - trench: L x B x D similar; higher length; effective storage 35%
    - shaft: dia x depth; assume 30% effective storage with gravel pack
    - recharge_well: dia x depth; assume 100% storage within well + percolation
    Returns: (dimensions_dict, effective_storage_liters, notes)
    """
    if structure_type == "pit":
        # Aim for a compact 1.5 x 1.5 x D design
        length_m = 1.5
        breadth_m = 1.5
        # effective_storage = 0.4 * L*B*D * 1000
        depth_m = max(1.2, target_storage_liters / (0.4 * length_m * breadth_m * 1000))
        volume_l = 0.4 * length_m * breadth_m * depth_m * 1000
        return ({"length_m": length_m, "breadth_m": breadth_m, "depth_m": round(depth_m, 2)}, volume_l, "40% void ratio assumed for pebble media")

    if structure_type == "trench":
        length_m = 6.0
        breadth_m = 0.6
        depth_m = max(1.2, target_storage_liters / (0.35 * length_m * breadth_m * 1000))
        volume_l = 0.35 * length_m * breadth_m * depth_m * 1000
        return ({"length_m": length_m, "breadth_m": breadth_m, "depth_m": round(depth_m, 2)}, volume_l, "35% void ratio assumed for brickbats")

    if structure_type == "shaft":
        diameter_m = 0.9
        depth_m = max(6.0, target_storage_liters / (0.3 * 3.1416 * (diameter_m/2) ** 2 * 1000))
        volume_l = 0.3 * 3.1416 * (diameter_m/2) ** 2 * depth_m * 1000
        return ({"diameter_m": diameter_m, "depth_m": round(depth_m, 1)}, volume_l, "30% effective storage with gravel pack")

    # recharge well
    diameter_m = 1.0
    depth_m = max(8.0, target_storage_liters / (3.1416 * (diameter_m/2) ** 2 * 1000))
    volume_l = 3.1416 * (diameter_m/2) ** 2 * depth_m * 1000
    return ({"diameter_m": diameter_m, "depth_m": round(depth_m, 1)}, volume_l, "Assuming full well volume as storage")


def estimate_costs(structure_type: str, effective_storage_liters: float) -> tuple[float, float]:
    """
    Rough cost curve (to be calibrated regionally):
    - Base cost per structure + cost per liter of storage.
    - OPEX is assumed as 2% of CAPEX per year for maintenance.
    """
    base_cost = {"pit": 20000, "trench": 35000, "shaft": 60000, "recharge_well": 120000}.get(structure_type, 30000)
    per_liter_cost = {"pit": 3.0, "trench": 2.5, "shaft": 4.0, "recharge_well": 4.5}.get(structure_type, 3.0)
    capex = base_cost + per_liter_cost * (effective_storage_liters / 1000)  # treat per KL
    opex = 0.02 * capex
    return capex, opex


def estimate_benefit(runoff_liters: float) -> float:
    """
    Benefit proxy: liters captured per year assumed as savings in freshwater extraction.
    Could be monetized externally; here we return liters/year for cost-benefit module to compute payback when unit water price is provided client-side or via config.
    """
    return runoff_liters


