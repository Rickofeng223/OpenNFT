import React, { useEffect,useState } from "react";
import logo from "../../assets/logo.png";
import {Actor, HttpAgent} from "@dfinity/agent";
import {idlFactory} from "../../../declarations/nft";
import {idlFactory as tokenUIdlFactory} from "../../../declarations/token";
import {Principal} from "@dfinity/principal";
import Button from "./Button"
import { opend } from "../../../declarations/opend";
import CURRENT_USER_ID from "../index";
import PrinceLabel from "./PriceLabel";


function Item(props) {
  const [name, setName] = useState();
  const [owner,setOwner] = useState();
  const [image,setImage] = useState();
  const [button,setButton] = useState();
  const [priceInput,setPrinceInput] = useState();
  const [loaderHidden,setloaderHidden] = useState(true);
  const [blur,setBlur] = useState();
  const [sellStatus,setSellStatus] = useState("");
  const [priceLabel,setPriceLabel] = useState();
  const [shouldDisplay,setDisplay] = useState(true);
  
  const id = props.id;  

  const localHost="http://localhost:8080/";
  const agent = new HttpAgent({host: localHost});  // come from @dfinity/agent package
  // When deploy live, remove following line agent.fetchRootKey(); it only works for local 
  agent.fetchRootKey();

  let NFTActor;

  async function loadNFT(){
    NFTActor = await Actor.createActor(idlFactory,{
      agent,
      canisterId : id,
    });

    const name = await NFTActor.getName();
    const owner = await NFTActor.getOwner();
    const imageData = await NFTActor.getAsset();
    // covert image content
    const imageContent = new Uint8Array(imageData);
    const image = URL.createObjectURL(new Blob([imageContent.buffer],{type: "image/png"}));

    setName(name);
    setOwner(owner.toText());//because owner is Principal type so we have to convert to toText to show on react bottom html code 
    setImage(image);
    
    if(props.role == "collection"){

      const nftIsListed = await opend.isListed(props.id);
      
      if(nftIsListed){
        setOwner("OpenD");
        setBlur({filter:"blur(6px)"});
        setSellStatus("Listed");
      }else{
        setButton(<Button handleClick={handleSell} text={"Sell"}/>);
      }
    }else if (props.role =="discover") {
      const originalOwner =  await opend.getOriginalOwner(props.id);
      if(originalOwner.toText() != CURRENT_USER_ID.toText()){  // if original owner is not the current owner, then able to see the buy button 
        setButton(<Button handleClick={handleBuy} text={"Buy"}/>);
      }
      
      const price = await opend.getListedNFTPrice(props.id);
      setPriceLabel( <PrinceLabel sellPrice={price.toString()}/>);
    }
  }
    
  useEffect(()=>{
    loadNFT();
  },[]);

  let price;
  function handleSell(){
    console.log("Sell click")
    setPrinceInput(<input
      placeholder="Price in Meow Token"
      type="number"
      className="price-input"
      value={price}
      onChange={(e)=> price = e.target.value}
    />);
    setButton(<Button handleClick={sellItem} text={"Confirm"}/>);  // when user click Confirm button call sellItem function 

  }

  async function sellItem(){
    setBlur({filter:"blur(6px)"});
    setloaderHidden(false);
    console.log("Confirm click Price is " + price)
    const listingResult = await opend.listItem(props.id,Number(price));
    console.log("listing : " + listingResult);
    if(listingResult == "Success"){
      const openDId = await opend.getOpenDCanisterID();
      const transferResult = await NFTActor.transferOwnership(openDId);
      console.log("transfer " + transferResult);
      if(transferResult == "Success"){
        setloaderHidden(true);
        setButton();
        setPrinceInput();
        setOwner("OpenD");
        setSellStatus("Listed");
      }
      // setloaderHidden(true);
      
    }
  }

  async function handleBuy(){
    console.log("buy was trigger ");
    setloaderHidden(false);
    
    const tokenActor = await Actor.createActor(tokenUIdlFactory,{
      agent,
      canisterId : Principal.fromText("rrkah-fqaaa-aaaaa-aaaaq-cai"),
    });

    const sellerId = await opend.getOriginalOwner(props.id);
    const itemPrice = await opend.getListedNFTPrice(props.id);

    const result = await tokenActor.transfer(sellerId,itemPrice);
    if(result == "Success"){
      // if Success transfer owner ship
      const transferResult = await opend.completePurchase(props.id,sellerId,CURRENT_USER_ID);
      console.log("purchased: " + transferResult);
      setloaderHidden(true);
      setDisplay(false);
    }
  }


  return (
    <div style={{display: shouldDisplay ?"inline" :  "none"}} className="disGrid-item">
      <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
        <img
          className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
          src={image}
          style={blur}
        />
        <div hidden={loaderHidden}className="lds-ellipsis">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
        <div className="disCardContent-root">
         {priceLabel}
          <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
            {name}<span className="purple-text">  {sellStatus }</span>
          </h2>
          <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
            Owner : {owner}
          </p>
          {priceInput}
          {button}
        </div>
      </div>
    </div>
  );
}

export default Item;
