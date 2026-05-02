const fetchPlacement = async () => {
  try {
    setLoading(true);
    const res = await api.get("/internship/my");
    setPlacement(res.data.internship);
    setDuration(res.data.duration);
    setHasPlacement(true);
  } catch (error) {
    if (error.response?.status === 404) {
      setHasPlacement(false);
    }
  } finally {
    try {
      const logsRes = await api.get("/internship/logs/my");
      setReminder(logsRes.data.reminder);
    } catch {
      setReminder(null);
    }
    setLoading(false);
  }
};