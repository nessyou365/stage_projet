const colors = {
  primary: "from-primary/20 to-secondary/20",
  secondary: "from-secondary/20 to-primary/20",
  accent: "from-accent/20 to-primary/20",
};
const GradientOrb = ({ className = "", color = "primary" }) => (
  <div className={`absolute rounded-full bg-gradient-to-br ${colors[color]} blur-3xl animate-float pointer-events-none ${className}`} />
);
export default GradientOrb;
