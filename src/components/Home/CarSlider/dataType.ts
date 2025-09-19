export interface ICar {
  Badge: string;
  FormYear: string;
  FuelType: string;
  Id: string;
  Manufacturer: string;
  Mileage: string;
  Model: string;
  ModifiedDate: string;
  Photo: string;
  Price: string;
  Transmission: string;
  Photos: {
    location: string;
    type: string;
  }[];
}
export interface ICarResponce {
  Count: string;
  SearchResults: ICar[];
}
