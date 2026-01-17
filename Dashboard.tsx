import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Droplets, Scale, Heart, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import Navbar from "@/components/Navbar";
import { mongodbClient } from "@/lib/mongodb-client";

// Sample data for charts
const glucoseData = [
  { date: "Jan", value: 105 },
  { date: "Feb", value: 112 },
  { date: "Mar", value: 98 },
  { date: "Apr", value: 115 },
  { date: "May", value: 108 },
  { date: "Jun", value: 102 },
  { date: "Jul", value: 95 },
];

const bmiData = [
  { date: "Jan", value: 27.5 },
  { date: "Feb", value: 27.2 },
  { date: "Mar", value: 26.8 },
  { date: "Apr", value: 26.5 },
  { date: "May", value: 26.2 },
  { date: "Jun", value: 25.9 },
  { date: "Jul", value: 25.5 },
];

const riskFactorsData = [
  { name: "BMI", value: 25, fill: "hsl(var(--chart-1))" },
  { name: "Glucose", value: 20, fill: "hsl(var(--chart-2))" },
  { name: "Blood Pressure", value: 15, fill: "hsl(var(--chart-3))" },
  { name: "Family History", value: 15, fill: "hsl(var(--chart-4))" },
  { name: "Age", value: 10, fill: "hsl(var(--chart-5))" },
  { name: "Other", value: 15, fill: "hsl(var(--muted))" },
];

const bloodPressureData = [
  { date: "Jan", systolic: 128, diastolic: 82 },
  { date: "Feb", systolic: 132, diastolic: 85 },
  { date: "Mar", systolic: 125, diastolic: 80 },
  { date: "Apr", systolic: 130, diastolic: 84 },
  { date: "May", systolic: 122, diastolic: 78 },
  { date: "Jun", systolic: 118, diastolic: 76 },
  { date: "Jul", systolic: 120, diastolic: 78 },
];

const emptyChartData = [{ date: "N/A", value: 0 }];
const emptyRiskData = [{ name: "Assessment Required", value: 100, fill: "hsl(var(--muted))" }];

const Dashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Patient");
  const [hasAssessmentData, setHasAssessmentData] = useState(false);

  useEffect(() => {
    const currentUser = mongodbClient.getCurrentUser();
    if (currentUser) {
      setUserName(currentUser.fullName || "Patient");
      setHasAssessmentData(currentUser.assessmentComplete || false);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const handleAssessmentRedirect = () => {
    navigate("/assessment");
  };

  const handleLogout = async () => {
    mongodbClient.logout();
    navigate("/");
  };

  const stats = [
    {
      title: "Latest Glucose",
      value: hasAssessmentData ? "95" : "N/A",
      unit: hasAssessmentData ? "mg/dL" : "-",
      icon: Droplets,
      trend: hasAssessmentData ? "down" : "",
      change: hasAssessmentData ? "-7%" : "",
      description: hasAssessmentData ? "Normal range" : "Complete assessment to see data",
    },
    {
      title: "Current BMI",
      value: hasAssessmentData ? "25.5" : "N/A",
      unit: hasAssessmentData ? "kg/m²" : "-",
      icon: Scale,
      trend: hasAssessmentData ? "down" : "",
      change: hasAssessmentData ? "-7.3%" : "",
      description: hasAssessmentData ? "Overweight" : "Complete assessment to see data",
    },
    {
      title: "Blood Pressure",
      value: hasAssessmentData ? "120/78" : "N/A",
      unit: hasAssessmentData ? "mmHg" : "-",
      icon: Heart,
      trend: hasAssessmentData ? "down" : "",
      change: hasAssessmentData ? "-6%" : "",
      description: hasAssessmentData ? "Normal" : "Complete assessment to see data",
    },
    {
      title: "Risk Score",
      value: hasAssessmentData ? "32" : "N/A",
      unit: hasAssessmentData ? "/100" : "-",
      icon: Activity,
      trend: hasAssessmentData ? "down" : "",
      change: hasAssessmentData ? "-12%" : "",
      description: hasAssessmentData ? "Moderate risk" : "Complete assessment to see data",
    },
  ];

  const currentGlucoseData = hasAssessmentData ? glucoseData : emptyChartData;
  const currentBmiData = hasAssessmentData ? bmiData : emptyChartData;
  const currentBpData = hasAssessmentData ? bloodPressureData : emptyChartData;
  const currentRiskFactors = hasAssessmentData ? riskFactorsData : emptyRiskData;

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated onLogout={handleLogout} />
      
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {userName}</h1>
          <p className="text-muted-foreground">Here's an overview of your health metrics</p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card 
              key={stat.title} 
              onClick={handleAssessmentRedirect} 
              className="cursor-pointer transition-shadow hover:shadow-lg"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  {hasAssessmentData && (
                    <div className={`flex items-center gap-1 text-sm ${
                      stat.trend === "down" ? "text-green-600" : "text-red-600"
                    }`}>
                      {stat.trend === "down" ? (
                        <TrendingDown className="h-4 w-4" />
                      ) : (
                        <TrendingUp className="h-4 w-4" />
                      )}
                      {stat.change}
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">{stat.unit}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="mt-1 text-xs text-primary">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Glucose Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-primary" />
                Glucose Trends
              </CardTitle>
              <CardDescription>{hasAssessmentData ? "Fasting blood glucose over time" : "Data unavailable. Please complete assessment."}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={currentGlucoseData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis domain={hasAssessmentData ? [80, 130] : [0, 1]} className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* BMI History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                BMI History
              </CardTitle>
              <CardDescription>{hasAssessmentData ? "Body mass index progression" : "Data unavailable. Please complete assessment."}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={currentBmiData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis domain={hasAssessmentData ? [20, 30] : [0, 1]} className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Blood Pressure */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Blood Pressure
              </CardTitle>
              <CardDescription>{hasAssessmentData ? "Systolic and diastolic readings" : "Data unavailable. Please complete assessment."}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={currentBpData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis domain={hasAssessmentData ? [60, 150] : [0, 1]} className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="systolic" 
                      stroke="hsl(var(--destructive))" 
                      strokeWidth={2}
                      name="Systolic"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="diastolic" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Diastolic"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Risk Factors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Risk Factor Analysis
              </CardTitle>
              <CardDescription>{hasAssessmentData ? "Contribution to overall diabetes risk" : "Data unavailable. Please complete assessment."}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={currentRiskFactors}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => hasAssessmentData ? `${name}: ${value}%` : name}
                    >
                      {currentRiskFactors.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
