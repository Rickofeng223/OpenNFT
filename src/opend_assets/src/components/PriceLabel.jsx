import React from 'react';

function PrinceLabel(props){
    return (
        <div className="disButtonBase-root disChip-root makeStyles-price-23 disChip-outlined">
          <span className="disChip-label">{props.sellPrice} Meow</span>
        </div>
    )
};

export default PrinceLabel;