"use client";

import { isAxiosError } from "axios";
import { SyntheticEvent, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { OrderStatus } from "@/interfaces/order";
import { ratingsService } from "@/services/ratings.service";

type RatingFormProps = {
  orderId: string;
  status: OrderStatus;
};

const SCORE_OPTIONS = [5, 4, 3, 2, 1].map((n) => ({
  value: String(n),
  label: `${n} ${n === 1 ? "estrella" : "estrellas"}`,
}));

// Solo el cliente ve este formulario y solo cuando la orden está COMPLETED.
export function RatingForm({ orderId, status }: RatingFormProps) {
  const [score, setScore] = useState("5");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== OrderStatus.COMPLETED) return null;

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await ratingsService.create({
        orderId,
        score: Number(score),
        comment: comment.trim() || undefined,
      });
      setDone(true);
    } catch (err: unknown) {
      // 409 si la orden ya fue calificada
      const message = isAxiosError(err) ? err.response?.data?.message : undefined;
      setError(message || "No se pudo guardar la calificación.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Alert
        variant="success"
        title="¡Gracias!"
        message="Tu calificación quedó registrada."
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="warning" title="No se pudo calificar" message={error} />}

      <Select
        label="Puntaje"
        name="score"
        value={score}
        onChange={(e) => setScore(e.target.value)}
        options={SCORE_OPTIONS}
      />

      <Textarea
        label="Comentario (opcional)"
        name="comment"
        value={comment}
        maxLength={500}
        onChange={(e) => setComment(e.target.value)}
      />

      <Button type="submit" disabled={submitting}>
        {submitting ? "Enviando..." : "Enviar calificación"}
      </Button>
    </form>
  );
}
