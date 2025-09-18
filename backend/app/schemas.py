
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr, constr
from typing import Optional, Literal, List

# --- Gamification Schemas ---
class ScoreOut(BaseModel):
	user_id: int
	points: int
	updated_at: datetime

class BadgeOut(BaseModel):
	id: int
	name: str
	description: str

class UserBadgeOut(BaseModel):
	badge: BadgeOut
	awarded_at: datetime

class LeaderboardEntryOut(BaseModel):
	user_id: int
	points: int
	group: str
	updated_at: datetime


class Token(BaseModel):
	access_token: str
	token_type: str = "bearer"


class UserCreate(BaseModel):
	email: EmailStr
	name: constr(min_length=1, strip_whitespace=True)
	password: constr(min_length=8)


class UserOut(BaseModel):
	id: int
	email: str
	name: str
	location: str | None = None
	created_at: datetime

	class Config:
		from_attributes = True


class UserUpdate(BaseModel):
	name: constr(min_length=1, strip_whitespace=True) | None = None
	email: EmailStr | None = None
	location: constr(strip_whitespace=True) | None = None


class LoginRequest(BaseModel):
	email: EmailStr
	password: constr(min_length=8)


class AssessmentInput(BaseModel):
	user_name: str
	location_desc: str
	latitude: float
	longitude: float
	num_dwellers: int
	rooftop_area_m2: float = Field(ge=0)
	open_space_area_m2: float = Field(ge=0)
	preferred_structure: Optional[Literal["pit", "trench", "shaft", "recharge_well"]] = None


class RunoffResult(BaseModel):
	annual_rainfall_mm: float
	runoff_coefficient: float
	annual_runoff_volume_liters: float


class StructureDesign(BaseModel):
	structure_type: Literal["pit", "trench", "shaft", "recharge_well"]
	dimensions: dict
	storage_volume_liters: float
	notes: str


class CostBenefit(BaseModel):
	capex_currency: float
	opex_currency_per_year: float
	water_savings_liters_per_year: float
	payback_years: float


class AssessmentResult(BaseModel):
	runoff: RunoffResult
	structure: StructureDesign
	cost: CostBenefit
	aquifer: dict
	recharge_potential_liters: float


class AssessmentOut(BaseModel):
	id: int
	created_at: datetime
	latitude: float
	longitude: float
	inputs: AssessmentInput
	results: AssessmentResult

	class Config:
		from_attributes = True


# Chat-related schemas
class ChatMessage(BaseModel):
	message: str = Field(..., min_length=1, max_length=1000, description="The user's message to the chatbot")


class ChatResponse(BaseModel):
	response: str = Field(..., description="The chatbot's response")


class ChatStreamResponse(BaseModel):
	chunk: str = Field(..., description="A chunk of the streaming response")


# Weather and Rain Prediction Schemas
class WeatherData(BaseModel):
	timestamp: datetime
	temperature: float = Field(..., description="Temperature in Celsius")
	humidity: float = Field(..., ge=0, le=100, description="Humidity percentage")
	pressure: float = Field(..., description="Atmospheric pressure in hPa")
	wind_speed: float = Field(..., ge=0, description="Wind speed in m/s")
	wind_direction: float = Field(..., ge=0, le=360, description="Wind direction in degrees")
	cloud_cover: float = Field(..., ge=0, le=100, description="Cloud cover percentage")
	precipitation: float = Field(..., ge=0, description="Precipitation in mm")
	precipitation_probability: float = Field(..., ge=0, le=100, description="Precipitation probability percentage")


class RainPrediction(BaseModel):
	forecast_hours: int = Field(..., ge=1, le=168, description="Hours ahead for prediction")
	predicted_rainfall: float = Field(..., ge=0, description="Predicted rainfall in mm")
	confidence: float = Field(..., ge=0, le=100, description="Prediction confidence percentage")
	time_series: list[dict] = Field(..., description="Hourly prediction breakdown")


class HarvestCalculation(BaseModel):
	roof_area_m2: float = Field(..., ge=0, description="Roof area in square meters")
	runoff_coefficient: float = Field(..., ge=0, le=1, description="Runoff coefficient")
	tank_capacity_liters: float = Field(..., ge=0, description="Tank capacity in liters")
	current_tank_level_liters: float = Field(..., ge=0, description="Current tank level in liters")
	predicted_harvest_liters: float = Field(..., ge=0, description="Predicted harvest in liters")
	overflow_risk: bool = Field(..., description="Whether tank will overflow")
	overflow_liters: float = Field(..., ge=0, description="Expected overflow in liters")


class ActionAlert(BaseModel):
	alert_type: Literal["filter_clean", "tank_overflow", "recharge_opportunity", "maintenance_reminder"]
	priority: Literal["low", "medium", "high", "urgent"]
	title: str = Field(..., description="Alert title")
	message: str = Field(..., description="Detailed alert message")
	action_required: str = Field(..., description="Specific action to take")
	deadline: Optional[datetime] = Field(None, description="When action should be completed")
	estimated_impact: str = Field(..., description="Impact of taking/not taking action")


class PredictionRequest(BaseModel):
	latitude: float = Field(..., ge=-90, le=90, description="Location latitude")
	longitude: float = Field(..., ge=-180, le=180, description="Location longitude")
	roof_area_m2: float = Field(..., ge=0, description="Roof area in square meters")
	tank_capacity_liters: float = Field(..., ge=0, description="Tank capacity in liters")
	current_tank_level_liters: float = Field(0, ge=0, description="Current tank level in liters")
	forecast_days: int = Field(7, ge=1, le=7, description="Number of days to forecast")


class PredictionResponse(BaseModel):
	location: dict = Field(..., description="Location information")
	weather_data: WeatherData = Field(..., description="Current weather data")
	rain_predictions: list[RainPrediction] = Field(..., description="Rain predictions for different time periods")
	harvest_calculations: HarvestCalculation = Field(..., description="Harvest volume calculations")
	action_alerts: list[ActionAlert] = Field(..., description="Generated action alerts")
	generated_at: datetime = Field(..., description="When prediction was generated")


class PostRainfallSummary(BaseModel):
	rainfall_period_start: datetime
	rainfall_period_end: datetime
	actual_rainfall_mm: float = Field(..., ge=0, description="Actual rainfall received")
	predicted_rainfall_mm: float = Field(..., ge=0, description="Predicted rainfall")
	accuracy_percentage: float = Field(..., ge=0, le=100, description="Prediction accuracy")
	harvested_liters: float = Field(..., ge=0, description="Water actually harvested")
	overflow_liters: float = Field(..., ge=0, description="Water lost to overflow")
	recharge_liters: float = Field(..., ge=0, description="Water diverted to recharge")
	efficiency_percentage: float = Field(..., ge=0, le=100, description="Harvest efficiency")


# Aquifer Data Schemas
class AquiferDataOut(BaseModel):
	id: int
	aquifer_type: str = Field(..., description="Type of aquifer (confined, unconfined, etc.)")
	gw_depth_m: float = Field(..., ge=0, description="Groundwater depth in meters")
	transmissivity_m2_per_day: float = Field(..., ge=0, description="Transmissivity in m²/day")
	storativity: float = Field(..., ge=0, le=1, description="Storativity coefficient")
	geom: dict = Field(..., description="Geometric data")

	class Config:
		from_attributes = True


class AquiferDataCreate(BaseModel):
	aquifer_type: str = Field(..., min_length=1, description="Type of aquifer")
	gw_depth_m: float = Field(..., ge=0, description="Groundwater depth in meters")
	transmissivity_m2_per_day: float = Field(..., ge=0, description="Transmissivity in m²/day")
	storativity: float = Field(..., ge=0, le=1, description="Storativity coefficient")
	geom: dict = Field(..., description="Geometric data")


# Groundwater Depth Schemas
class GWDepthPointOut(BaseModel):
	id: int
	depth_m: float = Field(..., ge=0, description="Groundwater depth in meters")
	obs_date: datetime = Field(..., description="Observation date")
	geom: dict = Field(..., description="Geometric data")

	class Config:
		from_attributes = True


class GWDepthPointCreate(BaseModel):
	depth_m: float = Field(..., ge=0, description="Groundwater depth in meters")
	obs_date: Optional[datetime] = Field(None, description="Observation date")
	geom: dict = Field(..., description="Geometric data")


# Soil Type Schemas
class SoilTypeOut(BaseModel):
	id: int
	soil_type: str = Field(..., description="Type of soil")
	permeability: float = Field(..., ge=0, description="Permeability in cm/hour")
	infiltration_rate: float = Field(..., ge=0, description="Infiltration rate in mm/hour")
	water_holding_capacity: float = Field(..., ge=0, description="Water holding capacity in mm")
	geom: dict = Field(..., description="Geometric data")

	class Config:
		from_attributes = True


class SoilTypeCreate(BaseModel):
	soil_type: str = Field(..., min_length=1, description="Type of soil")
	permeability: float = Field(..., ge=0, description="Permeability in cm/hour")
	infiltration_rate: float = Field(..., ge=0, description="Infiltration rate in mm/hour")
	water_holding_capacity: float = Field(..., ge=0, description="Water holding capacity in mm")
	geom: dict = Field(..., description="Geometric data")


# Location-based data request schemas
class LocationRequest(BaseModel):
	latitude: float = Field(..., ge=-90, le=90, description="Location latitude")
	longitude: float = Field(..., ge=-180, le=180, description="Location longitude")
	radius_km: float = Field(5.0, ge=0.1, le=50, description="Search radius in kilometers")


class AquiferDataResponse(BaseModel):
	location: dict = Field(..., description="Location information")
	aquifer_data: Optional[AquiferDataOut] = Field(None, description="Aquifer data for the location")
	nearest_aquifer: Optional[AquiferDataOut] = Field(None, description="Nearest aquifer data if no exact match")
	distance_km: Optional[float] = Field(None, description="Distance to nearest aquifer in kilometers")


class GWDepthResponse(BaseModel):
	location: dict = Field(..., description="Location information")
	gw_depth_points: list[GWDepthPointOut] = Field(..., description="Groundwater depth points in the area")
	average_depth_m: Optional[float] = Field(None, description="Average groundwater depth in meters")
	latest_depth_m: Optional[float] = Field(None, description="Most recent groundwater depth measurement")


class SoilTypeResponse(BaseModel):
	location: dict = Field(..., description="Location information")
	soil_data: Optional[SoilTypeOut] = Field(None, description="Soil type data for the location")
	nearest_soil: Optional[SoilTypeOut] = Field(None, description="Nearest soil type data if no exact match")
	distance_km: Optional[float] = Field(None, description="Distance to nearest soil data in kilometers")


# NASA POWER API Schemas
class NASAPowerData(BaseModel):
	"""NASA POWER API data point"""
	timestamp: datetime = Field(..., description="Date and time of the data point")
	temperature_2m: float = Field(..., description="Temperature at 2 meters in Celsius")
	precipitation: float = Field(..., ge=0, description="Precipitation in mm/day")
	soil_wetness: float = Field(..., ge=0, le=1, description="Surface soil wetness (0-1)")
	latitude: float = Field(..., ge=-90, le=90, description="Location latitude")
	longitude: float = Field(..., ge=-180, le=180, description="Location longitude")


class NASAPowerRequest(BaseModel):
	"""Request schema for NASA POWER data"""
	latitude: float = Field(..., ge=-90, le=90, description="Location latitude")
	longitude: float = Field(..., ge=-180, le=180, description="Location longitude")
	start_date: Optional[datetime] = Field(None, description="Start date for data (defaults to 30 days ago)")
	end_date: Optional[datetime] = Field(None, description="End date for data (defaults to today)")
	days_back: Optional[int] = Field(30, ge=1, le=365, description="Number of days to look back if dates not specified")


class NASAPowerResponse(BaseModel):
	"""Response schema for NASA POWER data"""
	location: dict = Field(..., description="Location information")
	data: List[NASAPowerData] = Field(..., description="NASA POWER data points")
	total_records: int = Field(..., description="Total number of data records")
	date_range: dict = Field(..., description="Date range of the data")
	generated_at: datetime = Field(..., description="When the data was generated")


class SoilAnalysisMetrics(BaseModel):
	"""Soil analysis metrics from NASA POWER data"""
	average_soil_wetness: float = Field(..., ge=0, le=1, description="Average soil wetness")
	max_soil_wetness: float = Field(..., ge=0, le=1, description="Maximum soil wetness")
	min_soil_wetness: float = Field(..., ge=0, le=1, description="Minimum soil wetness")
	soil_wetness_variability: float = Field(..., ge=0, description="Soil wetness variability")


class PrecipitationMetrics(BaseModel):
	"""Precipitation metrics from NASA POWER data"""
	total_precipitation_mm: float = Field(..., ge=0, description="Total precipitation in mm")
	average_daily_precipitation_mm: float = Field(..., ge=0, description="Average daily precipitation in mm")
	rainy_days: int = Field(..., ge=0, description="Number of rainy days")
	precipitation_frequency: float = Field(..., ge=0, le=100, description="Precipitation frequency percentage")


class TemperatureMetrics(BaseModel):
	"""Temperature metrics from NASA POWER data"""
	average_temperature_c: float = Field(..., description="Average temperature in Celsius")
	max_temperature_c: float = Field(..., description="Maximum temperature in Celsius")
	min_temperature_c: float = Field(..., description="Minimum temperature in Celsius")
	temperature_range_c: float = Field(..., ge=0, description="Temperature range in Celsius")


class SoilAssessments(BaseModel):
	"""Soil health and condition assessments"""
	soil_health: Literal["dry", "good", "saturated"] = Field(..., description="Overall soil health assessment")
	recharge_potential: Literal["low", "moderate", "high"] = Field(..., description="Groundwater recharge potential")
	drought_risk: Literal["low", "moderate", "high"] = Field(..., description="Drought risk assessment")


class SoilAnalysisResponse(BaseModel):
	"""Comprehensive soil analysis response"""
	location: dict = Field(..., description="Location information")
	analysis_period_days: int = Field(..., description="Number of days analyzed")
	soil_metrics: SoilAnalysisMetrics = Field(..., description="Soil wetness metrics")
	precipitation_metrics: PrecipitationMetrics = Field(..., description="Precipitation metrics")
	temperature_metrics: TemperatureMetrics = Field(..., description="Temperature metrics")
	assessments: SoilAssessments = Field(..., description="Soil health assessments")
	recommendations: List[str] = Field(..., description="Soil management recommendations")
	generated_at: datetime = Field(..., description="When the analysis was generated")


class NASAPowerForecastRequest(BaseModel):
	"""Request schema for NASA POWER forecast data"""
	latitude: float = Field(..., ge=-90, le=90, description="Location latitude")
	longitude: float = Field(..., ge=-180, le=180, description="Location longitude")
	days_ahead: int = Field(7, ge=1, le=30, description="Number of days to forecast")


class NASAPowerForecastResponse(BaseModel):
	"""Response schema for NASA POWER forecast data"""
	location: dict = Field(..., description="Location information")
	forecast_data: List[NASAPowerData] = Field(..., description="Forecast data points")
	forecast_days: int = Field(..., description="Number of forecast days")
	note: str = Field(..., description="Note about forecast data source")
	generated_at: datetime = Field(..., description="When the forecast was generated")


