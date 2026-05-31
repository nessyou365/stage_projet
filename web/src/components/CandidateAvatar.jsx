const getInitials = (name = "C") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "C";

const CandidateAvatar = ({ name, photoUrl, className = "w-10 h-10", rounded = "rounded-full", textClassName = "text-sm" }) => (
  <div className={`${className} ${rounded} bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0 overflow-hidden ${textClassName}`}>
    {photoUrl ? (
      <img src={photoUrl} alt={name || "Candidat"} className="w-full h-full object-cover" />
    ) : (
      getInitials(name)
    )}
  </div>
);

export default CandidateAvatar;
