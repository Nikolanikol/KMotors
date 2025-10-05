export interface ModelsResponce{
    Count : number
    DisplayValue : string
    Value : string
    Action : string
    Metadata : {
        EngName : string[]
        Code: string[]
    }
}
export const fetchModels = async (query: string) => {
  try {
    const res = await fetch(
      `https://api.encar.com/search/car/list/general?count=true&q=${query}&inav=%7CMetadata%7CSort`,
      {
        headers: {
          "user-agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
        },
      }
    )
      .then((data) => data.json())
      .then((res) => {

        const data = res.iNav.Nodes.find((i:any) => i.DisplayName === "국산여부")
          .Facets.find((i:any) => i.IsSelected === true)
          .Refinements.Nodes[0].Facets.find((i:any) => i.IsSelected === true)
          .Refinements.Nodes[0].Facets;
        console.log(data);
        return data as ModelsResponce[];
      });
    return res;
  } catch (error) {
    const res = fetch(
      `https://encar-proxy-main.onrender.com/api/nav?count=true&q=${query}&inav=%7CMetadata%7CSort`
    )
      .then((data) => data.json())
      .then((res) => {
        const data = res.iNav.Nodes.find((i:any) => i.DisplayName === "국산여부")
          .Facets.find((i:any) => i.IsSelected === true)
          .Refinements.Nodes[0].Facets.find((i:any) => i.IsSelected === true)
          .Refinements.Nodes[0].Facets;

        return data as ModelsResponce[];
      });

    return res ;
  }
};




export interface GenerationResponce{
    Count : number
    DisplayValue : string
    Value : string
    Action : string
    Metadata : {
        // EngName : string[]
        Code: string[]
    }
}
export const fetchGeneration = async(query:string)=>{
    try {
        const res = await fetch(
      `https://api.encar.com/search/car/list/general?count=true&q=${query}&inav=%7CMetadata%7CSort`, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
        },
      }
    )
    .then(data=>data.json())
    .then((res) => {

        const data      =  res.iNav.Nodes.find((i:any)=>i.DisplayName === '국산여부').Facets.find((i:any)=>i.IsSelected === true).Refinements.Nodes[0].Facets.find((i:any)=>i.IsSelected === true).Refinements.Nodes[0].Facets.find((i:any) => i.IsSelected === true).Refinements.Nodes[0].Facets

        return data 

    })

    return res
    } catch (error) {
         const res =  fetch(`https://encar-proxy-main.onrender.com/api/nav?count=true&q=${query}&inav=%7CMetadata%7CSort`)
        .then(data=>data.json())
    .then((res) => {
        const data      =  res.iNav.Nodes.find((i:any)=>i.DisplayName === '국산여부').Facets.find((i:any)=>i.IsSelected === true).Refinements.Nodes[0].Facets.find((i:any)=>i.IsSelected === true).Refinements.Nodes[0].Facets.find((i:any) => i.IsSelected === true).Refinements.Nodes[0].Facets
        console.log(data)
        return data as GenerationResponce

    })
    return res
    }
     
}