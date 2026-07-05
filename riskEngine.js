// ==========================================================
// SurgeWatch Flood Risk Engine
// ==========================================================

function calculateFloodRisk(data) {

    // -------------------------
    // Individual Component Scores
    // -------------------------

    const rainfallScore = Number(data.rainfallScore || 0);
    const floodplainScore = Number(data.floodplainScore || 0);
    const riverScore = Number(data.riverScore || 0);
    const alertScore = Number(data.alertScore || 0);
    const elevationScore = Number(data.elevationScore || 0);
    const drainageScore = Number(data.drainageScore || 0);

    // -------------------------
    // Total Score
    // -------------------------

    const totalScore = Math.min(
        100,
        rainfallScore +
        floodplainScore +
        riverScore +
        alertScore +
        elevationScore +
        drainageScore
    );

    // -------------------------
    // Risk Level
    // -------------------------

    let level = "LOW";

    if (totalScore >= 75) {
        level = "VERY HIGH";
    } else if (totalScore >= 50) {
        level = "HIGH";
    } else if (totalScore >= 25) {
        level = "MODERATE";
    }

    // -------------------------
    // Breakdown
    // -------------------------

    const breakdown = [

        {
            id: "rainfall",
            title: "Forecast Rainfall",
            score: rainfallScore,
            max: 30,
            status:
                rainfallScore >= 20
                    ? "Heavy rain expected"
                    : rainfallScore >= 10
                    ? "Moderate rainfall"
                    : "Little rainfall expected",

            explanation:
                data.rainfallExplanation ||
                "Rainfall forecast contributes to flood potential.",

            engineering:
                "Heavy rainfall can overwhelm drainage systems and increase runoff."
        },

        {
            id: "alerts",
            title: "NWS Flood Alerts",
            score: alertScore,
            max: 20,
            status:
                alertScore > 0
                    ? "Active flood alert"
                    : "No active alerts",

            explanation:
                data.alertExplanation ||
                "National Weather Service alerts increase the overall flood score.",

            engineering:
                "Official flood alerts indicate elevated confidence in hazardous conditions."
        },

        {
            id: "floodplain",
            title: "FEMA Floodplain",
            score: floodplainScore,
            max: 15,
            status:
                data.femaZone
                    ? `Zone ${data.femaZone}`
                    : "Unknown",

            explanation:
                data.floodplainExplanation ||
                "FEMA flood maps contribute to the overall score.",

            engineering:
                "Mapped floodplains represent long-term flood exposure."
        },

        {
            id: "river",
            title: "River Conditions",
            score: riverScore,
            max: 15,
            status:
                data.riverStatus ||
                "River conditions normal",

            explanation:
                data.riverExplanation ||
                "Nearby USGS gauges influence flood risk.",

            engineering:
                "River stage helps determine potential overflow conditions."
        },

        {
            id: "elevation",
            title: "Ground Elevation",
            score: elevationScore,
            max: 10,
            status:
                data.elevationFeet
                    ? `${data.elevationFeet} ft`
                    : "Unknown",

            explanation:
                data.elevationExplanation ||
                "Lower elevations generally experience greater flood exposure.",

            engineering:
                "Terrain elevation influences runoff accumulation."
        },

        {
            id: "drainage",
            title: "Drainage",
            score: drainageScore,
            max: 10,

            status:
                "Baseline estimate",

            explanation:
                data.drainageExplanation ||
                "Drainage currently uses a simplified model.",

            engineering:
                "Future versions will incorporate storm sewer capacity, impervious surface coverage, watershed size, and local drainage infrastructure."
        }

    ];

    // -------------------------
    // Overall Assessment
    // -------------------------

    let assessment =
        "Current conditions indicate relatively low flood risk.";

    if (level === "MODERATE") {
        assessment =
            "Some flood risk factors are present. Continue monitoring conditions.";
    }

    if (level === "HIGH") {
        assessment =
            "Several flood risk factors are elevated. Be prepared for rapidly changing conditions.";
    }

    if (level === "VERY HIGH") {
        assessment =
            "Multiple live data sources indicate significant flood potential. Avoid flooded roads and monitor official guidance.";
    }

    // -------------------------
    // Return Everything
    // -------------------------

    return {

        totalScore,

        level,

        rainfallScore,

        floodplainScore,

        riverScore,

        alertScore,

        elevationScore,

        drainageScore,

        breakdown,

        assessment

    };

}
