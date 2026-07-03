"use client";

import { useState } from "react";
import { Send, CheckCircle } from "lucide-react";

export default function CTASection() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", company: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="contact" className="section-padding relative">
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-accent/5 rounded-full blur-[120px]" />

      <div className="container-max relative z-10">
        <div className="glass rounded-3xl p-8 md:p-12 max-w-3xl mx-auto">
          {!submitted ? (
            <>
              <div className="text-center mb-8">
                <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-3">
                  Оставить заявку
                </h2>
                <p className="text-slate-400">
                  Свяжемся с вами в течение 15 минут. Бесплатная консультация по обследованию.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    required
                    placeholder="Ваше имя"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-bg-700 border border-white/10 text-white placeholder:text-slate-500 focus:border-accent/50 focus:outline-none transition-colors"
                  />
                  <input
                    required
                    type="tel"
                    placeholder="Телефон"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-bg-700 border border-white/10 text-white placeholder:text-slate-500 focus:border-accent/50 focus:outline-none transition-colors"
                  />
                </div>
                <input
                  placeholder="Компания (необязательно)"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-bg-700 border border-white/10 text-white placeholder:text-slate-500 focus:border-accent/50 focus:outline-none transition-colors"
                />
                <textarea
                  placeholder="Опишите объект или задачу"
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-bg-700 border border-white/10 text-white placeholder:text-slate-500 focus:border-accent/50 focus:outline-none transition-colors resize-none"
                />
                <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  Отправить заявку
                </button>
                <p className="text-xs text-slate-500 text-center">
                  Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности
                </p>
              </form>
            </>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
              <h3 className="font-display text-2xl font-bold text-white mb-2">Заявка отправлена!</h3>
              <p className="text-slate-400">Мы свяжемся с вами в ближайшее время.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
