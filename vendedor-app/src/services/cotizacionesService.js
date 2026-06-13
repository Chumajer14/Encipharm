import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { firestore } from "./firebase";

export async function guardarCotizacionCloud(cotizacion) {
  return addDoc(collection(firestore, "cotizaciones"), {
    ...cotizacion,
    origen: "vendedor-app",
    createdAt: serverTimestamp(),
  });
}