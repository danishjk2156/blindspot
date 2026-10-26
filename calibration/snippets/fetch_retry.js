async function fetchWithRetry(url, retries = 3) {
  let delay = 500;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      if (attempt === retries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
}
