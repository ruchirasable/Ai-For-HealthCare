import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ClipboardList, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import HealthRecommendations from "@/components/HealthRecommendations";
import { mongodbClient } from "@/lib/mongodb-client";

interface AssessmentData {
    age: number;
    gender: string;
    pulseRate: number;
    systolicBp: number;
    diastolicBp: number;
    glucose: number;
    height: number;
    weight: number;
    familyDiabetes: boolean;
    hypertensive: boolean;
    familyHypertension: boolean;
    cardiovascularDisease: boolean;
    stroke: boolean;
}

const Assessment = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [riskResult, setRiskResult] = useState<{ risk: string; score: number; factors: any } | null>(null);
    
    const [formData, setFormData] = useState<AssessmentData>({
        age: 0,
        gender: "",
        pulseRate: 0,
        systolicBp: 0,
        diastolicBp: 0,
        glucose: 0,
        height: 0,
        weight: 0,
        familyDiabetes: false,
        hypertensive: false,
        familyHypertension: false,
        cardiovascularDisease: false,
        stroke: false,
    });

    const calculateBMI = () => {
        if (formData.height > 0 && formData.weight > 0) {
            const heightInMeters = formData.height / 100;
            return (formData.weight / (heightInMeters * heightInMeters)).toFixed(1);
        }
        return "0";
    };

    const calculateRiskScore = () => {
        let score = 0;
        
        // Age factor
        if (formData.age >= 45) score += 15;
        else if (formData.age >= 35) score += 10;
        
        // BMI factor
        const bmi = parseFloat(calculateBMI());
        if (bmi >= 30) score += 20;
        else if (bmi >= 25) score += 10;
        
        // Glucose factor
        if (formData.glucose >= 126) score += 25;
        else if (formData.glucose >= 100) score += 15;
        
        // Blood pressure factor
        if (formData.systolicBp >= 140 || formData.diastolicBp >= 90) score += 15;
        else if (formData.systolicBp >= 130 || formData.diastolicBp >= 85) score += 10;
        
        // Family history
        if (formData.familyDiabetes) score += 15;
        if (formData.familyHypertension) score += 5;
        
        // Medical conditions
        if (formData.hypertensive) score += 10;
        if (formData.cardiovascularDisease) score += 10;
        if (formData.stroke) score += 5;
        
        return Math.min(score, 100);
    };

    const getRiskLevel = (score: number) => {
        if (score >= 60) return "High";
        if (score >= 30) return "Moderate";
        return "Low";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const score = calculateRiskScore();
        const risk = getRiskLevel(score);
        const bmi = parseFloat(calculateBMI());
        
        const factors = {
            highBMI: bmi >= 25,
            highGlucose: formData.glucose >= 100,
            highBP: formData.systolicBp >= 130 || formData.diastolicBp >= 85,
            familyHistory: formData.familyDiabetes,
            cardiovascular: formData.cardiovascularDisease,
            ageRisk: formData.age >= 45,
        };
        
        setRiskResult({ risk, score, factors });
        
        // Get current user from MongoDB client
        const currentUser = mongodbClient.getCurrentUser();

        if (!currentUser) {
            toast({
                title: "Authentication Error",
                description: "Please log in to save your assessment.",
                variant: "destructive",
            });
            setLoading(false);
            return;
        }

        // Save assessment to MongoDB
        const result = await mongodbClient.saveAssessment(currentUser.id, {
            ...formData,
            bmi,
            riskScore: score,
            riskLevel: risk,
        });

        if (result.error) {
            toast({
                title: "Save Error",
                description: result.error,
                variant: "destructive",
            });
            setLoading(false);
            return;
        }

        toast({
            title: "Assessment Complete",
            description: `Your diabetes risk level is ${risk}. Redirecting to dashboard...`,
        });
        
        setLoading(false);
        
        setTimeout(() => {
            navigate("/dashboard");
        }, 500);
    };

    const handleLogout = async () => {
        mongodbClient.logout();
        navigate("/");
    };
    
    return (
        <div className="min-h-screen bg-background">
            <Navbar isAuthenticated onLogout={handleLogout} />
            
            <div className="container py-8">
                <div className="mx-auto max-w-3xl">
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            <ClipboardList className="h-8 w-8 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground">Diabetes Risk Assessment</h1>
                        <p className="mt-2 text-muted-foreground">
                            Complete this assessment to evaluate your diabetes risk factors
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Personal Information</CardTitle>
                                <CardDescription>Basic demographic details</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="age">Age (years)</Label>
                                    <Input
                                        id="age"
                                        type="number"
                                        min={1}
                                        max={120}
                                        value={formData.age || ""}
                                        onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gender">Gender</Label>
                                    <Select
                                        value={formData.gender}
                                        onValueChange={(value) => setFormData({ ...formData, gender: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Vital Signs */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Vital Signs</CardTitle>
                                <CardDescription>Current health measurements</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="pulseRate">Pulse Rate (bpm)</Label>
                                    <Input
                                        id="pulseRate"
                                        type="number"
                                        min={40}
                                        max={200}
                                        value={formData.pulseRate || ""}
                                        onChange={(e) => setFormData({ ...formData, pulseRate: parseInt(e.target.value) || 0 })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="glucose">Fasting Glucose (mg/dL)</Label>
                                    <Input
                                        id="glucose"
                                        type="number"
                                        min={50}
                                        max={500}
                                        value={formData.glucose || ""}
                                        onChange={(e) => setFormData({ ...formData, glucose: parseInt(e.target.value) || 0 })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="systolicBp">Systolic BP (mmHg)</Label>
                                    <Input
                                        id="systolicBp"
                                        type="number"
                                        min={80}
                                        max={250}
                                        value={formData.systolicBp || ""}
                                        onChange={(e) => setFormData({ ...formData, systolicBp: parseInt(e.target.value) || 0 })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="diastolicBp">Diastolic BP (mmHg)</Label>
                                    <Input
                                        id="diastolicBp"
                                        type="number"
                                        min={40}
                                        max={150}
                                        value={formData.diastolicBp || ""}
                                        onChange={(e) => setFormData({ ...formData, diastolicBp: parseInt(e.target.value) || 0 })}
                                        required
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Body Measurements */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Body Measurements</CardTitle>
                                <CardDescription>Height and weight for BMI calculation</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="height">Height (cm)</Label>
                                    <Input
                                        id="height"
                                        type="number"
                                        min={100}
                                        max={250}
                                        value={formData.height || ""}
                                        onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) || 0 })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="weight">Weight (kg)</Label>
                                    <Input
                                        id="weight"
                                        type="number"
                                        min={20}
                                        max={300}
                                        value={formData.weight || ""}
                                        onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 0 })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Calculated BMI</Label>
                                    <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm">
                                        {calculateBMI()} kg/m²
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Medical History */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Medical History</CardTitle>
                                <CardDescription>Personal and family health history</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div>
                                        <Label htmlFor="familyDiabetes" className="font-medium">Family History of Diabetes</Label>
                                        <p className="text-sm text-muted-foreground">Parent or sibling with diabetes</p>
                                    </div>
                                    <Switch
                                        id="familyDiabetes"
                                        checked={formData.familyDiabetes}
                                        onCheckedChange={(checked) => setFormData({ ...formData, familyDiabetes: checked })}
                                    />
                                </div>
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div>
                                        <Label htmlFor="familyHypertension" className="font-medium">Family History of Hypertension</Label>
                                        <p className="text-sm text-muted-foreground">Parent or sibling with high blood pressure</p>
                                    </div>
                                    <Switch
                                        id="familyHypertension"
                                        checked={formData.familyHypertension}
                                        onCheckedChange={(checked) => setFormData({ ...formData, familyHypertension: checked })}
                                    />
                                </div>
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div>
                                        <Label htmlFor="hypertensive" className="font-medium">Currently Hypertensive</Label>
                                        <p className="text-sm text-muted-foreground">Diagnosed with high blood pressure</p>
                                    </div>
                                    <Switch
                                        id="hypertensive"
                                        checked={formData.hypertensive}
                                        onCheckedChange={(checked) => setFormData({ ...formData, hypertensive: checked })}
                                    />
                                </div>
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div>
                                        <Label htmlFor="cardiovascularDisease" className="font-medium">Cardiovascular Disease</Label>
                                        <p className="text-sm text-muted-foreground">History of heart disease or related conditions</p>
                                    </div>
                                    <Switch
                                        id="cardiovascularDisease"
                                        checked={formData.cardiovascularDisease}
                                        onCheckedChange={(checked) => setFormData({ ...formData, cardiovascularDisease: checked })}
                                    />
                                </div>
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div>
                                        <Label htmlFor="stroke" className="font-medium">History of Stroke</Label>
                                        <p className="text-sm text-muted-foreground">Previous stroke or TIA</p>
                                    </div>
                                    <Switch
                                        id="stroke"
                                        checked={formData.stroke}
                                        onCheckedChange={(checked) => setFormData({ ...formData, stroke: checked })}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Submit Button */}
                        <Button type="submit" className="w-full" size="lg" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Calculate Risk Assessment
                        </Button>
                    </form>

                    {/* Risk Result Display */}
                    {riskResult && (
                        <Card className={`mt-6 ${
                            riskResult.risk === "High" ? "border-destructive" :
                            riskResult.risk === "Moderate" ? "border-yellow-500" : "border-green-500"
                        }`}>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    {riskResult.risk === "High" ? (
                                        <AlertTriangle className="h-8 w-8 text-destructive" />
                                    ) : riskResult.risk === "Moderate" ? (
                                        <AlertTriangle className="h-8 w-8 text-yellow-500" />
                                    ) : (
                                        <CheckCircle className="h-8 w-8 text-green-500" />
                                    )}
                                    <div>
                                        <CardTitle>Risk Level: {riskResult.risk}</CardTitle>
                                        <CardDescription>Score: {riskResult.score}/100</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    )}

                    {/* Health Recommendations */}
                    {riskResult && (
                        <HealthRecommendations 
                            riskLevel={riskResult.risk as "Low" | "Moderate" | "High"}
                            riskScore={riskResult.score}
                            factors={riskResult.factors}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Assessment;
