"use client";
import mapboxgl, { LngLatLike } from "mapbox-gl";
import { useEffect } from "react";
import route from "@/app/data/route.json"; // Geojson file
import mapboxImg from "@/app/images/mapbox-logo.svg";
import flagImage from "@/app/images/fixed-vertical-checkered-flag-waving-vigorously-br.png";
import { useRef } from "react";
import {
  ChartConfig,
  ChartContainer,
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
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ReferenceLine, ReferenceDot } from "recharts";
import 'mapbox-gl/dist/mapbox-gl.css';
import Image from "next/image";

const PRIMARY="red"


const calculateDistance = (coord1: number[], coord2: number[]) => {
  const [x1, y1, z1] = coord1;
  const [x2, y2, z2] = coord2;
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2));
};

const elevationData = route.features[0].geometry.coordinates.map((coord, index, arr) => {
  const cumulativeDistance = index === 0 ? 0 : arr.slice(0, index).reduce((acc, curr, i) => acc + calculateDistance(arr[i], arr[i + 1]), 0);
  return {
    elevation: coord[2],
    distance: cumulativeDistance/1000,
  };
});

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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    mapboxgl.accessToken =
      "pk.eyJ1IjoidDBiZXMiLCJhIjoiY2tvcGtlYnZqMGx6aTJ4bDRxZmpsY202aiJ9.VDC7seXYYo8lGNtqJBjOAQ";

    if (mapContainerRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/t0bes/cm52nb8i500cs01s9avx676gs",
        projection: "globe",
        zoom: 11.59,
        center: [7.246491655545952, 45.38901721487122],
        pitch: 63.36,
        bearing: -43.99,
      });

      mapRef.current.on("load", () => {
        if(!mapRef.current){
          return
        }
        mapRef.current.addSource("route", {
          type: "geojson",
          data: route as GeoJSON.FeatureCollection<GeoJSON.LineString>,
        });

        // Start continuous rotation
        let currentBearing = mapRef.current.getBearing();
        function rotate() {
          if (!mapRef.current) return;
          currentBearing += 0.2; // Adjust speed by changing this value
          mapRef.current.easeTo({
            bearing: currentBearing,
            duration: 50,
            easing: (t) => t
          });
          requestAnimationFrame(rotate);
        }
        rotate();

        // Add layer for the track
        mapRef.current.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": PRIMARY,
            "line-width": 4,
            "line-opacity": 0.8,
          },
        });

        // Add popup at the 150th point showing altitude
        const popupCoordinates = route.features[0].geometry.coordinates[150];
        if (popupCoordinates) {
          const altitude = Math.round(popupCoordinates[2]);
          new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: [0, -15]
          })
            .setLngLat(popupCoordinates as LngLatLike)
            .setHTML(`<div class="text-sm font-semibold ">Altitude: ${altitude}m</div>`)
            .addTo(mapRef.current);
        }

        // Add flag at the end of the path
        const lastCoordinate = route.features[0].geometry.coordinates[route.features[0].geometry.coordinates.length - 1];
        if (lastCoordinate) {
          const flagEl = document.createElement('div');
          flagEl.className = 'flag-wrapper';
          const flagInner = document.createElement('div');
          flagInner.className = 'flag-marker';
          const flagImg = document.createElement('img');
          flagImg.src = flagImage.src;
          flagImg.alt = 'finish flag';
          flagInner.appendChild(flagImg);
          flagEl.appendChild(flagInner);

          new mapboxgl.Marker({
            element: flagEl,
            anchor: 'bottom',
            offset: [20, 10]
          })
            .setLngLat(lastCoordinate as LngLatLike)
            .addTo(mapRef.current);
        }
      });

      // // Add zoom controls
      mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      mapRef.current.on("moveend", () => {
        if(!mapRef.current){
          return
        }
        console.log(
          JSON.stringify({
            zoom: mapRef.current.getZoom(),
            center: mapRef.current.getCenter(),
            pitch: mapRef.current.getPitch(),
            bearing: mapRef.current.getBearing(),
          })
        );
      });
      return () => mapRef.current?.remove();
    }
  }, []);


  return (
    <div className="bg-gray-900 text-white theme">
      <Card className="absolute top-6 left-6 w-auto opacity-80 overflow-hidden">
        <CardHeader className="py-3 px-4 flex flex-row gap-2 justify-between items-center sm:flex-row">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
            Nivolet Hill
          </CardTitle>
          <div className="text-xs font-semibold text-muted-foreground">using</div>
          <Image src={mapboxImg} alt="mapbox logo"/>
        </CardHeader>
      </Card>
      <Card className="absolute bottom-4 left-6 w-full max-w-xl opacity-80">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1 text-center sm:text-left">
            <CardTitle>Elevation Chart</CardTitle>
            <CardDescription>
             Route elevation and distance
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart
              data={elevationData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              className="text-white"
            >
              <defs>
                <linearGradient id="fillElevation" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={PRIMARY} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="black" strokeOpacity={0.2} />
              <XAxis
                dataKey="distance"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `${(value).toFixed(1)}`}
                type="number"
                domain={[0, 'auto']}
                className="text-white"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `${(value)}m`}
                className="text-white"
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent />}
                wrapperStyle={{ backgroundColor: '#333', borderColor: '#555' }}
              />
              <Area
                type="monotone"
                dataKey="elevation"
                stroke={PRIMARY}
                fillOpacity={1}
                fill="url(#fillElevation)"
              />
              <ReferenceLine
                x={elevationData[150].distance}
                stroke={PRIMARY}
                strokeWidth={2}
                strokeDasharray="3 3"
              />
              <ReferenceDot
                x={elevationData[150].distance}
                y={elevationData[150].elevation}
                r={6}
                fill={PRIMARY}
                stroke="white"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <div
        ref={mapContainerRef}
        id="map-container"
      />
    </div>
  );
}
