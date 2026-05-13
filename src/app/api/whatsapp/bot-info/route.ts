import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_CLOUD_TOKEN;

  if (!phoneId || !token) {
    return NextResponse.json({ error: "WhatsApp credentials not configured" }, { status: 500 });
  }

  try {
    const response = await axios.get(`https://graph.facebook.com/v19.0/${phoneId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const { display_phone_number, id } = response.data;
    
    return NextResponse.json({ 
      phoneNumber: display_phone_number,
      phoneId: id,
      waLink: `https://wa.me/${display_phone_number.replace(/\D/g, "")}?text=Hi`
    });
  } catch (error: any) {
    console.error("[WhatsApp Bot Info Error]:", error.response?.data || error.message);
    return NextResponse.json({ error: "Failed to fetch bot info from Meta" }, { status: 500 });
  }
}
