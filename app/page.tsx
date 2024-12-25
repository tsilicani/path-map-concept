"use client";
import mapboxgl from "mapbox-gl";
import { useEffect } from "react";
import route from "@/app/data/route.json"; // Geojson file
import { useRef } from "react";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

const elevationData = route.features[0].geometry.coordinates.map((coord) => ({
  elevation: coord[2],
}));

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export default function Home() {
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mapboxgl.accessToken =
      "pk.eyJ1IjoidDBiZXMiLCJhIjoiY2tvcGtlYnZqMGx6aTJ4bDRxZmpsY202aiJ9.VDC7seXYYo8lGNtqJBjOAQ";

    if (mapContainer.current) {
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/t0bes/cm52nb8i500cs01s9avx676gs",
        projection: "globe",
        zoom: 11.59,
        center: [7.246491655545952, 45.38901721487122],
        pitch: 63.36,
        bearing: -43.99,
      });

      map.on("load", () => {
        map.addSource("route", {
          type: "geojson",
          data: route as GeoJSON.FeatureCollection<GeoJSON.LineString>,
        });
        // Add layer for the track
        map.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "red",
            "line-width": 4,
            "line-opacity": 0.8,
          },
        });
      });

      // // Add zoom controls
      map.addControl(new mapboxgl.NavigationControl(), "top-right");

      map.on("moveend", () => {
        console.log(
          JSON.stringify({
            zoom: map.getZoom(),
            center: map.getCenter(),
            pitch: map.getPitch(),
            bearing: map.getBearing(),
          })
        );
      });
      return () => map.remove();
    }
  }, []);

  return (
    <div className="">
      <Card className="absolute bottom-4 left-6 w-full max-w-lg">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1 text-center sm:text-left">
            <CardTitle>Elevation Chart - Interactive</CardTitle>
            <CardDescription>
              Showing elevation data for the route
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={elevationData}>
              <defs>
                <linearGradient id="fillElevation" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-elevation)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-elevation)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="elevation"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return value;
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="elevation"
                type="natural"
                fill="url(#fillElevation)"
                stroke="var(--color-elevation)"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <div
        ref={mapContainer}
        style={{
          width: "100vw",
          height: "100vh",
          zIndex: -1,
        }}
      />
    </div>
  );
}
