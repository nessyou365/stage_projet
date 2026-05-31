import { useNavigate } from "react-router-dom";
const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold gradient-text">404</h1>
      <p className="text-muted-foreground">Page not found</p>
      <button onClick={() => navigate("/dashboard")} className="btn-primary-gradient">← Back to Dashboard</button>
    </div>
  );
};
export default NotFound;
