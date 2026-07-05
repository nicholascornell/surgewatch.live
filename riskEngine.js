function calculateFloodRisk(data) {
  const clamp = (value, max) =>
    Math.max(0, Math.min(max, Math.round(Number(value) || 0)));

  const safeText = (value, fallback = "Unavailable") => {
    if (value === null || value === undefined || value === "") return fallback;
    return String(value);
  };

  const zone = safeText(data.femaZone, "Unknown").toUpperCase();
  const rainfallInches = data.rainfallInches;
  const maxHourlyRain = data.maxHourlyRain;
  const alertText = safeText(data.alertText, "").toLowerCase();
  const elevationFeet = data.elevationFeet;
  const usgsText = safeText(data.usgsText || data.gaugeText, "").toLowerCase();

  let rainfallScore = 0;
  if (typeof rainfallInches === "number") {
    if (rainfallInches >= 4 || maxHourlyRain >= 1.5) rainfallScore = 30;
    else if (rainfallInches >= 2.5 || maxHourlyRain >= 1) rainfallScore = 25;
    else if (rainfallInches >= 1.25 || maxHourlyRain >= 0.5) rainfallScore = 18;
    else if (rainfallInches >= 0.5 || maxHourlyRain >= 0.25) rainfallScore = 10;
    else if (rainfallInches > 0) rainfallScore = 5;
  } else {
    rainfallScore = clamp((Number(data.rainRisk || 0) / 40) * 30, 30);
  }

  let alertScore = 0;
  if (alertText.includes("flash flood warning") || alertText.includes("flood warning")) alertScore = 20;
  else if (alertText.includes("flash flood watch") || alertText.includes("flood watch")) alertScore = 14;
  else if (alertText.includes("advisory")) alertScore = 8;
  else alertScore = clamp((Number(data.alertRisk || 0) / 40) * 20, 20);

  let floodplainScore = 6;
  if (zone === "X" || zone.includes("MINIMAL")) floodplainScore = 1;
  else if (zone.includes("VE") || zone === "V") floodplainScore = 15;
  else if (["AE", "A", "AO", "AH"].some(z => zone.includes(z))) floodplainScore = 13;
  else if (zone.includes("D")) floodplainScore = 8;

  let riverScore = 7;
  const stageMatch = usgsText.match(/([0-9]+(?:\.[0-9]+)?)\s*ft/);
  if (stageMatch) {
    const stage = Number(stageMatch[1]);
    if (stage >= 12) riverScore = 15;
    else if (stage >= 8) riverScore = 11;
    else if (stage >= 4) riverScore = 7;
    else riverScore = 2;
  }

  let elevationScore = 5;
  if (typeof elevationFeet === "number") {
    if (elevationFeet < 10) elevationScore = 10;
    else if (elevationFeet < 30) elevationScore = 8;
    else if (elevationFeet < 100) elevationScore = 6;
    else if (elevationFeet < 500) elevationScore = 3;
    else elevationScore = 1;
  }

  let drainageScore = 2;
  if (typeof rainfallInches === "number" && rainfallInches >= 0.75) drainageScore += 1;
  if (typeof maxHourlyRain === "number" && maxHourlyRain >= 0.5) drainageScore += 1;
  if (typeof elevationFeet === "number" && elevationFeet < 100) drainageScore += 1;
  drainageScore = clamp(drainageScore, 5);

  const tideScore = 0;

  const totalScore = Math.min(
    100,
    rainfallScore +
      alertScore +
      floodplainScore +
      riverScore +
      elevationScore +
      drainageScore +
      tideScore
  );

  let level = "LOW";
  if (totalScore >= 75) level = "VERY HIGH";
  else if (totalScore >= 50) level = "HIGH";
  else if (totalScore >= 25) level = "MODERATE";

  const breakdown = [
    {
      key: "rainfall",
      id: "rainfall",
      name: "Forecast Rainfall",
      title: "Forecast Rainfall",
      score: rainfallScore,
      max: 30,
      status: typeof rainfallInches === "number" ? `${rainfallInches.toFixed(2)} inches expected` : "Rainfall estimate",
      explanation: "Rainfall is one of the strongest short-term flood risk drivers.",
      engineering: "Heavy or intense rainfall can overwhelm storm drains, streets, culverts, and low-lying areas."
    },
    {
      key: "alerts",
      id: "alerts",
      name: "NWS Flood Alerts",
      title: "NWS Flood Alerts",
      score: alertScore,
      max: 20,
      status: alertScore > 0 ? "Flood alert detected" : "No active flood alert",
      explanation: safeText(data.alertText, "No National Weather Service flood alert is currently active."),
      engineering: "Official alerts add confidence that hazardous flooding conditions may develop."
    },
    {
      key: "floodplain",
      id: "floodplain",
      name: "FEMA Floodplain",
      title: "FEMA Floodplain",
      score: floodplainScore,
      max: 15,
      status: `Zone ${safeText(data.femaZone, "Unknown")}`,
      explanation: "FEMA flood zones represent mapped long-term flood exposure.",
      engineering: "Mapped floodplains indicate areas where floodwater has historically or statistically been expected to reach."
    },
    {
      key: "river",
      id: "river",
      name: "River Conditions",
      title: "River Conditions",
      score: riverScore,
      max: 15,
      status: safeText(data.usgsText || data.gaugeText, "Nearest gauge checked"),
      explanation: "Nearby USGS river gauge conditions are included in the score.",
      engineering: "Elevated river stages can reduce drainage capacity and increase overflow risk."
    },
    {
      key: "elevation",
      id: "elevation",
      name: "Ground Elevation",
      title: "Ground Elevation",
      score: elevationScore,
      max: 10,
      status: typeof elevationFeet === "number" ? `${elevationFeet} ft` : "Unknown elevation",
      explanation: "Lower ground elevation generally increases flood exposure.",
      engineering: "Low elevation areas collect runoff more easily and are more vulnerable to coastal, river, and drainage flooding."
    },
    {
      key: "drainage",
      id: "drainage",
      name: "Local Drainage",
      title: "Local Drainage",
      score: drainageScore,
      max: 5,
      status: "Baseline estimate",
      explanation: "Drainage is currently estimated from rainfall intensity and site elevation.",
      engineering: "Future versions can add storm sewer capacity, impervious surface, slope, soil type, and watershed flow."
    },
    {
      key: "tide",
      id: "tide",
      name: "Tide / Coastal Influence",
      title: "Tide / Coastal Influence",
      score: tideScore,
      max: 5,
      status: "Coming soon",
      explanation: "Tide overlap will be added for coastal and tidal locations.",
      engineering: "High tides can slow drainage and worsen flooding near tidal rivers and coastal outfalls."
    }
  ];

  let assessment = "Current conditions indicate low flood risk.";
  if (level === "MODERATE") assessment = "Some flood risk factors are present. Conditions should be monitored.";
  if (level === "HIGH") assessment = "Several flood risk factors are elevated. Flooding is possible in vulnerable areas.";
  if (level === "VERY HIGH") assessment = "Multiple live data sources indicate significant flood potential. Monitor official guidance and avoid flooded roads.";

  return {
    totalScore,
    level,
    rainfallScore,
    alertScore,
    floodplainScore,
    riverScore,
    elevationScore,
    drainageScore,
    tideScore,
    breakdown,
    assessment
  };
}
