import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Zap, ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: Non-existent route accessed:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4 py-16">
      <SEO 
        title="404 — Wrong Turn | ChargePush"
        description="The page you are looking for does not exist on ChargePush."
        noindex={true}
      />
      <div className="w-20 h-20 gradient-primary rounded-3xl flex items-center justify-center shadow-xl mb-6 animate-pulse">
        <Zap className="w-10 h-10 text-white" />
      </div>
      <h1 className="font-display font-black text-4xl md:text-5xl text-foreground mb-3">
        Looks like you've taken a wrong turn.
      </h1>
      <p className="text-lg text-muted-foreground max-w-md mb-8 font-medium">
        Let's get you back on the road. Find nearby charging access or return to the homepage.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Button asChild className="gradient-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2">
          <Link to="/spots">
            <MapPin className="w-4 h-4" /> Find a Charge
          </Link>
        </Button>
        <Button asChild variant="outline" className="px-8 py-3 rounded-xl font-semibold flex items-center gap-2">
          <Link to="/">
            <ArrowLeft className="w-4 h-4" /> Return Home
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;

