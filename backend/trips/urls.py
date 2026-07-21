from django.urls import path

from .views import PlanTripView, ReverseGeocodeView

urlpatterns = [
    path("plan-trip/", PlanTripView.as_view(), name="plan-trip"),
    path("reverse-geocode/", ReverseGeocodeView.as_view(), name="reverse-geocode"),
]
