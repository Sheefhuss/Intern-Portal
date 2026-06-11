export const SEEDED_USERS = [
  { email: "admin@enginow.in", pass: "admin123", role: "admin", name: "System Admin" },
  { email: "hr@enginow.in", pass: "hr123", role: "hr", name: "Divya Pillai (HR)" },
  { email: "aarav@intern.enginow.in", pass: "aarav123", role: "member", name: "Aarav Shah" },
  { email: "priya@intern.enginow.in", pass: "priya123", role: "member", name: "Priya Nair" },
];

export const TASKS = [
  { id: 1, title: "Complete UI Research Report", domain: "Design", due: "Jun 15", status: "In Progress", priority: "High" },
  { id: 2, title: "Review API Documentation", domain: "Backend", due: "Jun 14", status: "Pending", priority: "Medium" },
  { id: 3, title: "Setup Dev Environment", domain: "DevOps", due: "Jun 13", status: "Done", priority: "Low" },
];

export const PROJECTS = [
  { name: "Intern Portal", progress: 45, domain: "Full Stack", team: 6 },
  { name: "Company Website Revamp", progress: 70, domain: "Frontend", team: 4 },
];

export const INTERNS = [
  { name: "Aarav Shah", email: "aarav@intern.enginow.in", domain: "Frontend", batch: "B1", progress: 72 },
  { name: "Priya Nair", email: "priya@intern.enginow.in", domain: "Backend", batch: "B1", progress: 58 },
  { name: "Kiran Das", email: "kiran@intern.enginow.in", domain: "Design", batch: "B2", progress: 34 },
];

export const DOMAINS = ["Frontend", "Backend", "Full Stack", "Design", "DevOps", "ML/AI"];