import { Card, CardContent } from "@/components/ui/card";

const travelers = [
  { name: "Hugo", avatar: "/avatars/hugo.png", animal: "Zorro" },
  { name: "Jessica", avatar: "/avatars/jessica.png", animal: "Grulla" },
  { name: "Camille", avatar: "/avatars/camille.png", animal: "Panda Bebé" },
  { name: "Eugenio", avatar: "/avatars/eugenio.png", animal: "Tanuki" },
  { name: "Astrid", avatar: "/avatars/astrid.png", animal: "Ciervo" },
  { name: "Ashley", avatar: "/avatars/ashley.png", animal: "Gato" },
  { name: "Valeria", avatar: "/avatars/valeria.png", animal: "Conejo" },
];

export default function TravelersSection() {
  return (
    <section className="py-16 px-4 bg-secondary/20">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Nuestros Viajeros</h2>
          <p className="text-muted-foreground">
            Familia Carrillo - Aventureros rumbo a Japón y Corea del Sur
          </p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-6 max-w-6xl mx-auto">
          {travelers.map((traveler) => (
            <Card key={traveler.name} className="text-center hover:shadow-lg transition-all hover:-translate-y-1">
              <CardContent className="pt-6 pb-4">
                <div className="relative mb-3">
                  <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-primary/20 shadow-md">
                    <img
                      src={traveler.avatar}
                      alt={traveler.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                </div>
                <h3 className="font-bold text-lg mb-1">{traveler.name}</h3>
                <p className="text-xs text-muted-foreground">{traveler.animal}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

