import { connectDB } from "@/config/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import Recording from "@/models/recordingModel";
import { validateJWT } from "@/helpers/validateJWT";

connectDB();

export async function GET(request: NextRequest) {
  try {
    await validateJWT(request);
    const { searchParams } = new URL(request.url);
    const productCode = searchParams.get("popCode");

    const filtersObject: any = {};
    if (productCode) {
      filtersObject.productCode = productCode;
    }

    const products =
      await Recording.find(filtersObject).populate("productCode");
    // console.log(products);

    let totalBuyPrice = 0;
    let totalSellPrice = 0;
    let totalBuyUnits = 0;
    let totalSellUnits = 0;
    let totalSellTaxes = 0;
    let totalBuyTaxes = 0;
    let totalReturnUnits = 0;
    let totalReturnPrice = 0;
    let totalTrashedUnits = 0;
    let totalTrashedPrice = 0;

    products.forEach((product: any) => {
      if (product.mode === "buying") {
        totalBuyPrice += product.pricePerUnit * product.units;
        totalBuyUnits += product.units;
        totalBuyTaxes += (product.pricePerUnit * product.units * product.taxes) / 100;
      } else if (product.mode === "selling") {
        totalSellPrice += product.pricePerUnit * product.units;
        totalSellUnits += product.units;
        totalSellTaxes += (product.pricePerUnit * product.units * product.taxes) / 100;
      } else if ( product.mode === "returning") {
        totalReturnUnits += product.units;
        totalReturnPrice += product.pricePerUnit * product.units;
      } else if ( product.mode === "lost") {
        totalTrashedUnits += product.units;
        totalTrashedPrice += product.pricePerUnit * product.units;
      }
    });

    const avgBuyPrice = totalBuyPrice / totalBuyUnits;
    const avgSellPrice = totalSellPrice / totalSellUnits;
    const avgBuyTaxes = totalBuyTaxes / totalBuyUnits;

    // console.log("Average Buy Price:", avgBuyPrice);
    // console.log("Average Sell Price:", avgSellPrice);
    return NextResponse.json(
      {
        unitsRemaining: totalBuyUnits - totalSellUnits + totalReturnUnits,
        unitsSold: totalSellUnits,
        unitsReturned: totalReturnUnits,
        unitsTrashed: totalTrashedUnits,
        averageBuyPrice: avgBuyPrice,
        averageSellPrice: avgSellPrice,
        profitProduct: totalSellPrice - totalBuyPrice - totalSellTaxes + totalBuyTaxes - totalReturnPrice - totalTrashedPrice,
        profitSale: (totalSellUnits - totalReturnUnits - totalTrashedUnits) * (avgSellPrice - avgBuyPrice) - totalSellTaxes + totalSellUnits * avgBuyTaxes,
        averageMoneyInTax: totalSellTaxes / totalSellUnits,
        
      },
      {
        status: 201,
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Something Went Wrong" },
      { status: 500 }
    );
  }
}
