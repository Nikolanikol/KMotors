"use server";

export async function getCars(query: string, offset: string = "0") {

  try {
    const res = await fetch(
      `https://api.encar.com/search/car/list/premium?count=true&q=${query}&sr=%7CModifiedDate%7C${offset}%7C20
`,
      {
          cache: 'force-cache',
        headers: {
          "user-agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
     },
      }
    );
    const data = await res.json();

    return   {
      data: data.SearchResults,
      count: data.Count,
    } ;
  } catch {
    const fallbackRes = await fetch(
      `https://encar-proxy-main.onrender.com/api/catalog?count=true&q=${query}&sr=%7CModifiedDate%7C${offset}%7C20
`, {
      cache: 'force-cache',
}
    );

    const fallbackData = await fallbackRes.json();
    console.log(fallbackData, "fallbackData");
    return {
      data: fallbackData.SearchResults,
      count: fallbackData.Count,
    };
  }
}