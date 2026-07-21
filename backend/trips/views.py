from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import TripRequestSerializer
from .services.geocode import GeocodeError, geocode, reverse_geocode
from .services.hos_engine import compute_hos_plan
from .services.routing import RoutingError, get_route


class ReverseGeocodeView(APIView):
    throttle_scope = 'reverse-geocode'

    def get(self, request):
        lat_raw = request.query_params.get("lat")
        lon_raw = request.query_params.get("lon")
        if lat_raw is None or lon_raw is None:
            return Response({"error": "lat and lon query params are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            lat = float(lat_raw)
            lon = float(lon_raw)
        except ValueError:
            return Response({"error": "lat and lon must be numbers"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            address = reverse_geocode(lat, lon)
        except GeocodeError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"address": address})


class PlanTripView(APIView):
    throttle_scope = 'plan-trip'

    def post(self, request):
        serializer = TripRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            current_coord = geocode(data["current_location"])
            pickup_coord = geocode(data["pickup_location"])
            dropoff_coord = geocode(data["dropoff_location"])
        except GeocodeError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        try:
            route = get_route(current_coord, pickup_coord, dropoff_coord)
        except RoutingError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        plan = compute_hos_plan(
            route=route,
            current_coord=current_coord,
            pickup_coord=pickup_coord,
            dropoff_coord=dropoff_coord,
            current_cycle_used=data["current_cycle_used"],
            pickup_address=data["pickup_location"],
            dropoff_address=data["dropoff_location"],
        )

        return Response({"route": route, "stops": plan["stops"], "daily_logs": plan["daily_logs"]})
