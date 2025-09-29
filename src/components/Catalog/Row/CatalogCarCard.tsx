"use client";

const CarCard = (props) => {
  return (
    <div onClick={() => alert("click")}>
      <h1>{props.name}</h1>
    </div>
  );
};

export default CarCard;
