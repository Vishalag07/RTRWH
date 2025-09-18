"""
Action alerts service for generating intelligent water management alerts
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any
import logging

from app.schemas import ActionAlert, RainPrediction, HarvestCalculation, WeatherData

logger = logging.getLogger(__name__)


class AlertService:
    def __init__(self):
        self.alert_templates = {
            "filter_clean": {
                "title": "Filter Maintenance Required",
                "action_required": "Clean and inspect your rainwater filters",
                "estimated_impact": "Prevents contamination and ensures maximum water quality"
            },
            "tank_overflow": {
                "title": "Tank Overflow Risk",
                "action_required": "Divert excess water to recharge pit or storage",
                "estimated_impact": "Prevents water loss and maximizes harvest efficiency"
            },
            "recharge_opportunity": {
                "title": "Optimal Recharge Conditions",
                "action_required": "Prepare recharge pit and ensure proper drainage",
                "estimated_impact": "Maximizes groundwater recharge and prevents flooding"
            },
            "maintenance_reminder": {
                "title": "System Maintenance Due",
                "action_required": "Inspect and maintain your RWH system components",
                "estimated_impact": "Ensures optimal system performance and longevity"
            }
        }

    def generate_alerts(
        self,
        rain_predictions: List[RainPrediction],
        harvest_calculation: HarvestCalculation,
        weather_data: WeatherData,
        location_info: Dict[str, Any]
    ) -> List[ActionAlert]:
        """Generate action alerts based on predictions and calculations"""
        
        alerts = []
        
        # Check for immediate rain (next 24 hours)
        immediate_rain = self._get_immediate_rain_prediction(rain_predictions)
        if immediate_rain and immediate_rain.predicted_rainfall > 5.0:
            alerts.extend(self._generate_immediate_rain_alerts(
                immediate_rain, harvest_calculation, weather_data
            ))
        
        # Check for tank overflow risk
        if harvest_calculation.overflow_risk:
            alerts.append(self._generate_overflow_alert(harvest_calculation))
        
        # Check for recharge opportunities
        recharge_alert = self._check_recharge_opportunity(
            rain_predictions, harvest_calculation, weather_data
        )
        if recharge_alert:
            alerts.append(recharge_alert)
        
        # Check for maintenance needs
        maintenance_alert = self._check_maintenance_needs(
            harvest_calculation, weather_data, location_info
        )
        if maintenance_alert:
            alerts.append(maintenance_alert)
        
        # Sort alerts by priority
        alerts.sort(key=lambda x: self._get_priority_score(x.priority))
        
        return alerts

    def _get_immediate_rain_prediction(self, predictions: List[RainPrediction]) -> RainPrediction:
        """Get the 24-hour rain prediction"""
        for pred in predictions:
            if pred.forecast_hours == 24:
                return pred
        return None

    def _generate_immediate_rain_alerts(
        self,
        rain_prediction: RainPrediction,
        harvest_calculation: HarvestCalculation,
        weather_data: WeatherData
    ) -> List[ActionAlert]:
        """Generate alerts for immediate rain forecast"""
        alerts = []
        
        # Filter cleaning alert for significant rain
        if rain_prediction.predicted_rainfall > 10.0:
            alerts.append(ActionAlert(
                alert_type="filter_clean",
                priority="high",
                title="Heavy Rain Expected - Clean Filters",
                message=f"Expected {rain_prediction.predicted_rainfall:.1f}mm of rain in the next 24 hours. Clean your filters today to maximize harvest quality.",
                action_required="Clean and inspect all rainwater filters, gutters, and first flush systems",
                deadline=datetime.now() + timedelta(hours=12),
                estimated_impact="Ensures clean water collection and prevents contamination"
            ))
        
        # Tank overflow warning
        if harvest_calculation.overflow_risk:
            alerts.append(ActionAlert(
                alert_type="tank_overflow",
                priority="urgent",
                title="Tank Overflow Risk - Immediate Action Required",
                message=f"Expected harvest of {harvest_calculation.predicted_harvest_liters:.0f}L will exceed tank capacity by {harvest_calculation.overflow_liters:.0f}L",
                action_required="Divert excess water to recharge pit or additional storage",
                deadline=datetime.now() + timedelta(hours=6),
                estimated_impact="Prevents water loss and potential flooding"
            ))
        
        return alerts

    def _generate_overflow_alert(self, harvest_calculation: HarvestCalculation) -> ActionAlert:
        """Generate tank overflow alert"""
        return ActionAlert(
            alert_type="tank_overflow",
            priority="urgent",
            title="Tank Overflow Risk",
            message=f"Your tank will overflow by {harvest_calculation.overflow_liters:.0f}L. Take immediate action to prevent water loss.",
            action_required="Divert excess water to recharge pit or additional storage",
            deadline=datetime.now() + timedelta(hours=2),
            estimated_impact="Prevents water loss and maximizes harvest efficiency"
        )

    def _check_recharge_opportunity(
        self,
        rain_predictions: List[RainPrediction],
        harvest_calculation: HarvestCalculation,
        weather_data: WeatherData
    ) -> ActionAlert:
        """Check if conditions are optimal for groundwater recharge"""
        
        # Look for moderate rain (5-20mm) over 3-7 days
        moderate_rain = False
        for pred in rain_predictions:
            if pred.forecast_hours >= 72 and 5.0 <= pred.predicted_rainfall <= 20.0:
                moderate_rain = True
                break
        
        if moderate_rain and harvest_calculation.current_tank_level_liters < harvest_calculation.tank_capacity_liters * 0.3:
            return ActionAlert(
                alert_type="recharge_opportunity",
                priority="medium",
                title="Optimal Recharge Conditions",
                message="Moderate rainfall expected over the next few days. Perfect conditions for groundwater recharge.",
                action_required="Prepare recharge pit, check drainage, and ensure proper water flow",
                deadline=datetime.now() + timedelta(days=1),
                estimated_impact="Maximizes groundwater recharge and prevents surface runoff"
            )
        
        return None

    def _check_maintenance_needs(
        self,
        harvest_calculation: HarvestCalculation,
        weather_data: WeatherData,
        location_info: Dict[str, Any]
    ) -> ActionAlert:
        """Check if system maintenance is needed"""
        
        # Simple maintenance schedule based on usage
        # In a real system, this would track actual maintenance history
        maintenance_due = False
        
        # Check if it's been a while since last rain (dry period maintenance)
        if weather_data.precipitation == 0 and weather_data.humidity < 50:
            maintenance_due = True
        
        if maintenance_due:
            return ActionAlert(
                alert_type="maintenance_reminder",
                priority="low",
                title="System Maintenance Due",
                message="Dry weather conditions are ideal for system maintenance and inspection.",
                action_required="Inspect gutters, filters, tanks, and all RWH system components",
                deadline=datetime.now() + timedelta(days=3),
                estimated_impact="Ensures optimal system performance and prevents issues"
            )
        
        return None

    def _get_priority_score(self, priority: str) -> int:
        """Get numeric score for priority sorting"""
        priority_scores = {
            "low": 1,
            "medium": 2,
            "high": 3,
            "urgent": 4
        }
        return priority_scores.get(priority, 0)

    def generate_post_rainfall_summary(
        self,
        actual_rainfall: float,
        predicted_rainfall: float,
        harvested_liters: float,
        overflow_liters: float,
        period_start: datetime,
        period_end: datetime
    ) -> Dict[str, Any]:
        """Generate post-rainfall summary and insights"""
        
        # Calculate accuracy
        accuracy = max(0, 100 - abs(actual_rainfall - predicted_rainfall) / max(actual_rainfall, 1) * 100)
        
        # Calculate efficiency
        total_rainfall_liters = actual_rainfall * 1000  # Convert mm to liters per m²
        efficiency = (harvested_liters / total_rainfall_liters * 100) if total_rainfall_liters > 0 else 0
        
        # Generate insights
        insights = []
        
        if accuracy > 80:
            insights.append("Excellent prediction accuracy! The forecast was very reliable.")
        elif accuracy > 60:
            insights.append("Good prediction accuracy. Minor adjustments may improve future forecasts.")
        else:
            insights.append("Prediction accuracy was lower than expected. Weather conditions may have been unpredictable.")
        
        if efficiency > 70:
            insights.append("Great harvest efficiency! Your system is performing well.")
        elif efficiency > 50:
            insights.append("Moderate harvest efficiency. Consider checking filters and gutters.")
        else:
            insights.append("Low harvest efficiency. System maintenance may be needed.")
        
        if overflow_liters > 0:
            insights.append(f"Water overflow occurred ({overflow_liters:.0f}L lost). Consider increasing storage capacity or improving diversion systems.")
        
        return {
            "accuracy_percentage": round(accuracy, 1),
            "efficiency_percentage": round(efficiency, 1),
            "insights": insights,
            "recommendations": self._generate_recommendations(accuracy, efficiency, overflow_liters)
        }

    def _generate_recommendations(
        self,
        accuracy: float,
        efficiency: float,
        overflow_liters: float
    ) -> List[str]:
        """Generate recommendations based on performance"""
        recommendations = []
        
        if accuracy < 60:
            recommendations.append("Consider improving weather data sources or prediction models.")
        
        if efficiency < 50:
            recommendations.append("Inspect and clean all system components regularly.")
            recommendations.append("Check for leaks in gutters, pipes, and storage tanks.")
        
        if overflow_liters > 100:
            recommendations.append("Install additional storage capacity or improve diversion systems.")
            recommendations.append("Consider implementing automated overflow management.")
        
        if not recommendations:
            recommendations.append("System is performing well. Continue regular maintenance schedule.")
        
        return recommendations
