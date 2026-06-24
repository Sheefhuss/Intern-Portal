export function groupUsers(users, groupBy) {
  if (groupBy === "none") return [{ key: null, label: null, users }];

  const field = groupBy === "domain" ? "domain" : "batch";
  const groups = {};
  users.forEach(u => {
    const key = u[field] || (field === "domain" ? "No Domain" : "No Batch");
    if (!groups[key]) groups[key] = [];
    groups[key].push(u);
  });

  return Object.keys(groups)
    .sort((a, b) => a.localeCompare(b))
    .map(key => ({ key, label: key, users: groups[key] }));
}