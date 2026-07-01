'use client';

import { useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import styles from '../../landing.module.css';

function SpotlightCard({ product, index }) {
  const linkRef = useRef(null);
  const Icon = LucideIcons[product.icon] ?? LucideIcons.Sparkles;

  const handleMouseMove = useCallback(e => {
    const el = linkRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--glow-x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
    el.style.setProperty('--glow-y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
    el.style.setProperty('--glow-opacity', '1');
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = linkRef.current;
    if (el) el.style.setProperty('--glow-opacity', '0');
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
      style={{ display: 'flex' }}
    >
      <Link
        href={`/${product.slug}`}
        className={styles.productCard}
        ref={linkRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <Icon size={48} className={styles.productIcon} strokeWidth={1.25} />
        <h3 className={styles.productName}>{product.name}</h3>
        <p className={styles.productDesc}>{product.description}</p>
        <span className={styles.productCta}>Попробовать →</span>
      </Link>
    </motion.div>
  );
}

export default function AnimatedCards({ products }) {
  return (
    <div className={styles.productsGrid}>
      {products.map((p, i) => (
        <SpotlightCard key={p.id} product={p} index={i} />
      ))}
    </div>
  );
}
