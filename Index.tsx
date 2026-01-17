import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import { mongodbClient } from "@/lib/mongodb-client";

const Index = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const user = mongodbClient.getCurrentUser();
    setIsAuthenticated(!!user);
  }, []);

  const handleLogout = () => {
    mongodbClient.logout();
    setIsAuthenticated(false);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated={isAuthenticated} onLogout={handleLogout} />
      <HeroSection />
    </div>
  );
};

export default Index;
