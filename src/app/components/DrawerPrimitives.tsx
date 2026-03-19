/**
 * DrawerPrimitives.tsx
 * ─────────────────────────────────────────────────────────────
 * Libreria di primitivi condivisi per tutti i drawer
 * dell'Admin Dashboard Sottotesi.
 *
 * Drawer di creazione:
 *   - CreateLavorazioneDrawer
 *   - CreatePipelineDrawer
 *   - CreateStudentDrawer
 *   - CreateCoachDrawer
 *   - NotesDrawer
 *
 * Drawer di dettaglio:
 *   - LavorazioneDetailDrawer
 *   - PipelineDetailDrawer
 *
 * Tutti i valori di stile usano variabili CSS del design system.
 * NON usare colori, font o spacing hardcoded in questo file.
 * ─────────────────────────────────────────────────────────────
 */

import React from 'react';
import { X, ChevronDown, ChevronUp, ExternalLink, BookOpen, GraduationCap, User, Globe, Search, Plus } from 'lucide-react';

// ─── Larghezze standard drawer ────────────────────────────────
export const DRAWER_WIDTH_DEFAULT = '520px';
export const DRAWER_WIDTH_WIDE    = '640px';

// ─── Shared degree label map (condivisa con tutti i drawer) ──
export const DEGREE_LEVEL_MAP: Record<string, string> = {
  triennale: 'Triennale',
  magistrale: 'Magistrale',
  ciclo_unico: 'Ciclo unico',
  master: 'Master',
  dottorato: 'Dottorato',
};

// ─── Shared style objects ─────────────────────────────────────
/** Input testuale standard */
export const drawerInputStyle: React.CSSProperties = {
  padding: '0.5rem 0.625rem',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--border)',
  fontFamily: 'var(--font-inter)',
  fontSize: 'var(--text-label)',
  fontWeight: 'var(--font-weight-regular)',
  backgroundColor: 'var(--input-background)',
  color: 'var(--foreground)',
  outline: 'none',
  width: '100%',
  lineHeight: '1.5',
  boxSizing: 'border-box' as const,
};

/** Select dropdown standard (inline, non usa classe CSS globale) */
export const drawerSelectStyle: React.CSSProperties = {
  ...drawerInputStyle,
  cursor: 'pointer',
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23717680' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 0.75rem center',
  paddingRight: '2rem',
};

/** Etichetta campo form */
export const drawerLabelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-inter)',
  fontSize: 'var(--text-label)',
  fontWeight: 'var(--font-weight-medium)',
  color: 'var(--muted-foreground)',
  marginBottom: '0.25rem',
  lineHeight: '1.5',
};

/** Micro-etichetta uppercase (es. "Email principale") */
export const drawerMicroLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-weight-medium)',
  color: 'var(--muted-foreground)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  marginBottom: '0.25rem',
  lineHeight: '1.5',
};

/** Titolo di sezione */
export const drawerSectionTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: 'var(--text-label)',
  fontWeight: 'var(--font-weight-semibold)',
  color: 'var(--foreground)',
  margin: '0 0 0.75rem 0',
  lineHeight: '1.5',
};

/** Testo readonly (valore presente) */
export const drawerReadonlyValueStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: 'var(--text-label)',
  color: 'var(--foreground)',
  lineHeight: '1.5',
};

/** Testo readonly (valore assente / placeholder) */
export const drawerReadonlyEmptyStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: 'var(--text-label)',
  color: 'var(--muted-foreground)',
  lineHeight: '1.5',
  fontStyle: 'italic',
};

/** Spaziatura standard tra campi */
export const drawerFieldGroupStyle: React.CSSProperties = {
  marginBottom: '0.75rem',
};

// ─── Costanti stato servizi (condivise tra tutti i drawer) ────

/**
 * Mappa status → colore CSS (dot + testo).
 * Usata da DrawerStatusPill e da tutti i drawer che mostrano lavorazioni collegate.
 */
export const SERVICE_STATUS_COLORS: Record<string, string> = {
  pending_payment: 'var(--chart-3)',
  active: 'var(--primary)',
  paused: 'var(--chart-2)',
  completed: 'var(--muted-foreground)',
  cancelled: 'var(--destructive-foreground)',
  expired: 'var(--muted-foreground)',
};

/**
 * Mappa status → etichetta italiana (abbreviata per spazi ridotti).
 * Usata da DrawerStatusPill.
 */
export const SERVICE_STATUS_LABELS_IT: Record<string, string> = {
  pending_payment: 'In att. pagamento',
  active: 'Attivo',
  paused: 'In pausa',
  completed: 'Completato',
  cancelled: 'Annullato',
  expired: 'Scaduto',
};

// ─── Componenti ───────────────────────────────────────────────

/**
 * Overlay semitrasparente che copre lo schermo.
 * Usa le animazioni definite in dashboard.css.
 */
export function DrawerOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 999,
        animation: 'fadeIn 200ms ease-in-out',
      }}
    />
  );
}

/**
 * Pannello drawer fisso a destra.
 * Usa le animazioni definite in dashboard.css (slideInFromRight).
 */
export function DrawerShell({
  children,
  width = DRAWER_WIDTH_DEFAULT,
}: {
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width,
        maxWidth: '100vw',
        background: 'var(--card)',
        borderLeft: '1px solid var(--border)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
        animation: 'slideInFromRight 300ms ease-out',
      }}
    >
      {children}
    </div>
  );
}

/**
 * Header del drawer con icona, titolo, sottotitolo opzionale e pulsante chiudi.
 */
export function DrawerHeader({
  icon,
  title,
  subtitle,
  onClose,
  actions,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  onClose: () => void;
  /** Nodi aggiuntivi (es. badge stato) posizionati prima del pulsante chiudi */
  actions?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.5rem',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        gap: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
        {icon && (
          <span style={{ color: 'var(--primary)', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            {icon}
          </span>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              margin: 0,
              lineHeight: '1.5',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-sm)',
                color: 'var(--muted-foreground)',
                margin: 0,
                lineHeight: '1.5',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions}
      <DrawerCloseButton onClose={onClose} />
    </div>
  );
}

/** Pulsante X chiudi, riutilizzabile anche fuori dall'header */
export function DrawerCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '0.5rem',
        color: 'var(--muted-foreground)',
        borderRadius: 'var(--radius)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
      title="Chiudi"
      aria-label="Chiudi drawer"
    >
      <X size={18} />
    </button>
  );
}

/**
 * Area body scrollabile del drawer.
 */
export function DrawerBody({
  children,
  padding = '1.5rem',
}: {
  children: React.ReactNode;
  padding?: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Footer del drawer, sticky in fondo.
 */
export function DrawerFooter({
  children,
  direction = 'row',
}: {
  children: React.ReactNode;
  /** 'row' (default) | 'column' */
  direction?: 'row' | 'column';
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: direction,
        alignItems: direction === 'row' ? 'center' : 'stretch',
        justifyContent: direction === 'row' ? 'flex-end' : undefined,
        gap: '0.75rem',
        padding: '1rem 1.5rem',
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Separatore orizzontale.
 */
export function DrawerDivider({ margin = '0' }: { margin?: string }) {
  return (
    <div
      style={{
        height: '1px',
        backgroundColor: 'var(--border)',
        margin,
      }}
    />
  );
}

/**
 * Sezione con bordo superiore e padding top.
 * Wrappa contenuto di una sezione semantica nel drawer.
 */
export function DrawerSection({
  title,
  icon,
  hint,
  children,
  bordered = true,
}: {
  title?: string;
  icon?: React.ReactNode;
  /** Testo piccolo a destra del titolo (es. "Gestisci da Pipeline") */
  hint?: string;
  children: React.ReactNode;
  bordered?: boolean;
}) {
  return (
    <section
      style={bordered ? { borderTop: '1px solid var(--border)', paddingTop: '1.5rem' } : undefined}
    >
      {title && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.75rem',
          }}
        >
          {icon && (
            <span style={{ color: 'var(--muted-foreground)', flexShrink: 0, display: 'flex' }}>
              {icon}
            </span>
          )}
          <h3 style={{ ...drawerSectionTitleStyle, margin: 0 }}>{title}</h3>
          {hint && (
            <span
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-xs)',
                color: 'var(--muted-foreground)',
                lineHeight: '1.5',
                marginLeft: 'auto',
              }}
            >
              {hint}
            </span>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * Wrapper campo form con spaziatura standard.
 */
export function DrawerFieldGroup({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ ...drawerFieldGroupStyle, ...style }}>
      {children}
    </div>
  );
}

/**
 * Etichetta campo form.
 */
export function DrawerLabel({
  children,
  required,
  htmlFor,
}: {
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} style={drawerLabelStyle}>
      {children}
      {required && (
        <span style={{ color: 'var(--muted-foreground)', marginLeft: '0.25rem' }}>*</span>
      )}
    </label>
  );
}

/**
 * Micro-etichetta uppercase (es. "Email principale", "Telefono aggiuntivo").
 */
export function DrawerMicroLabel({ children }: { children: React.ReactNode }) {
  return <div style={drawerMicroLabelStyle}>{children}</div>;
}

/**
 * Stato vuoto per sezioni senza contenuto.
 */
export function DrawerEmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '1rem',
        background: 'var(--muted)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-label)',
          color: 'var(--muted-foreground)',
          lineHeight: '1.5',
        }}
      >
        {children}
      </span>
    </div>
  );
}

/**
 * Riga read-only chiave/valore (es. dati accademici, dati pipeline).
 */
export function DrawerReadonlyRow({
  label,
  value,
  minLabelWidth = '120px',
}: {
  label: string;
  value?: string | null;
  minLabelWidth?: string;
}) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
      <span
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-label)',
          color: 'var(--muted-foreground)',
          fontWeight: 'var(--font-weight-medium)',
          lineHeight: '1.5',
          flexShrink: 0,
          minWidth: minLabelWidth,
        }}
      >
        {label}
      </span>
      <span style={value ? drawerReadonlyValueStyle : drawerReadonlyEmptyStyle}>
        {value || '—'}
      </span>
    </div>
  );
}

/**
 * Note informativa (sfondo muted, bordo standard).
 */
export function DrawerInfoNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '0.625rem 0.875rem',
        backgroundColor: 'var(--muted)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-sm)',
          color: 'var(--muted-foreground)',
          margin: 0,
          lineHeight: '1.5',
        }}
      >
        {children}
      </p>
    </div>
  );
}

/**
 * Tag/chip con pulsante rimuovi — usato per fonti, tags, etc.
 */
export function DrawerChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove?: () => void;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.25rem 0.625rem',
        borderRadius: 'var(--radius-badge)',
        background: 'var(--muted)',
        fontFamily: 'var(--font-inter)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--font-weight-medium)',
        color: 'var(--foreground)',
        lineHeight: '1.5',
      }}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            color: 'var(--muted-foreground)',
          }}
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
}

/**
 * Pulsante "aggiungi" tratteggiato — pattern per aggiungere record/sezioni.
 */
export function DrawerAddButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.375rem',
        background: 'none',
        border: '1px dashed var(--border)',
        borderRadius: 'var(--radius)',
        padding: '0.5rem 0.75rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-inter)',
        fontSize: 'var(--text-label)',
        fontWeight: 'var(--font-weight-medium)',
        color: disabled ? 'var(--muted-foreground)' : 'var(--primary)',
        width: '100%',
        lineHeight: '1.5',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

// ─── Nuovi primitivi per drawer di dettaglio ──────────────────

/**
 * Sezione collassabile con header toggle.
 * Usata nei drawer di dettaglio (LavorazioneDetail, PipelineDetail).
 * Gestisce autonomamente il padding orizzontale — usare con DrawerBody padding="0".
 */
export function DrawerCollapsibleSection({
  icon: Icon,
  title,
  badge,
  badgeColor,
  alertBadge,
  isOpen,
  onToggle,
  children,
}: {
  icon?: React.ElementType;
  title: string;
  badge?: string;
  badgeColor?: string;
  alertBadge?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.875rem 1.5rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          gap: '0.5rem',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--muted)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
          {Icon && <Icon size={16} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />}
          <span
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--foreground)',
              lineHeight: '1.5',
              flex: 1,
              textAlign: 'left',
            }}
          >
            {title}
          </span>
          {badge && (
            <span
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-weight-medium)',
                color: badgeColor || 'var(--muted-foreground)',
                padding: '0.125rem 0.5rem',
                borderRadius: 'var(--radius-badge)',
                background: 'var(--muted)',
                lineHeight: '1.5',
                flexShrink: 0,
              }}
            >
              {badge}
            </span>
          )}
          {alertBadge && (
            <span
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--destructive-foreground)',
                padding: '0 0.375rem',
                borderRadius: '999px',
                lineHeight: '18px',
                border: '1px solid var(--destructive-foreground)',
                flexShrink: 0,
              }}
            >
              {alertBadge}
            </span>
          )}
        </span>
        {isOpen
          ? <ChevronUp size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
          : <ChevronDown size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />}
      </button>
      {isOpen && (
        <div style={{ padding: '0 1.5rem 1rem' }}>
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Header di sezione collassabile per drawer di CREAZIONE.
 * A differenza di DrawerCollapsibleSection (che wrappa header + contenuto),
 * questo è solo il toggle — il contenuto viene reso dal genitore.
 * Usare con DrawerBody a padding standard (non "0").
 */
export function DrawerSectionToggle({
  icon: Icon,
  title,
  isOpen,
  onToggle,
  badge,
}: {
  icon?: React.ElementType;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 0',
        background: 'none',
        border: 'none',
        borderBottom: isOpen ? '1px solid var(--border)' : 'none',
        marginBottom: isOpen ? '1rem' : '0',
        cursor: 'pointer',
        gap: '0.5rem',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
        {Icon && <Icon size={16} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />}
        <span
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--foreground)',
            lineHeight: '1.5',
            textAlign: 'left',
          }}
        >
          {title}
        </span>
        {badge && (
          <span
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--muted-foreground)',
              background: 'var(--muted)',
              padding: '0.125rem 0.5rem',
              borderRadius: 'var(--radius-badge)',
              lineHeight: '1.5',
              flexShrink: 0,
            }}
          >
            {badge}
          </span>
        )}
      </span>
      {isOpen
        ? <ChevronUp size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
        : <ChevronDown size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />}
    </button>
  );
}

/**
 * Dot colorato + etichetta stato servizio.
 * Usata nelle card lavorazioni collegate (PipelineDetail, StudentDetail).
 * Accetta direttamente un `status` (chiave da SERVICE_STATUS_*) oppure
 * valori espliciti `color` e `label` per casi custom.
 */
export function DrawerStatusPill({
  status,
  label,
  color,
}: {
  status?: string;
  label?: string;
  color?: string;
}) {
  const resolvedColor = color
    || (status ? SERVICE_STATUS_COLORS[status] : undefined)
    || 'var(--muted-foreground)';
  const resolvedLabel = label
    || (status ? SERVICE_STATUS_LABELS_IT[status] : undefined)
    || status
    || '—';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
      <span
        style={{
          display: 'inline-block',
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          background: resolvedColor,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-xs)',
          color: resolvedColor,
          fontWeight: 'var(--font-weight-medium)',
          lineHeight: '1.5',
        }}
      >
        {resolvedLabel}
      </span>
    </span>
  );
}

/**
 * Pulsante di navigazione "Vai →" con icona ExternalLink.
 * Pattern standard per collegarsi a una riga in un'altra pagina.
 * Usato nelle card lavorazioni collegate (PipelineDetail, StudentDetail).
 */
export function DrawerNavButton({
  label = 'Vai',
  onClick,
  title,
}: {
  label?: string;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        padding: '0.375rem 0.5rem',
        border: '1px solid var(--border)',
        background: 'var(--card)',
        cursor: 'pointer',
        color: 'var(--primary)',
        borderRadius: 'var(--radius)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        fontFamily: 'var(--font-inter)',
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--font-weight-medium)',
        lineHeight: '1.5',
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          'color-mix(in srgb, var(--primary) 8%, transparent)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--card)';
      }}
    >
      <ExternalLink size={13} />
      {label}
    </button>
  );
}

/**
 * Card lavorazione collegata — pattern standard per mostrare
 * una lavorazione associata a una pipeline o a uno studente.
 * Compone DrawerStatusPill + DrawerNavButton.
 */
export function DrawerLinkedServiceCard({
  id,
  serviceName,
  status,
  coachName,
  referente,
  onNavigate,
}: {
  id: string;
  serviceName: string;
  status: string;
  coachName?: string;
  referente?: string;
  onNavigate: () => void;
}) {
  const subtitle = [id, coachName, referente ? `Ref: ${referente}` : '']
    .filter(Boolean)
    .join(' · ');
  return (
    <div
      style={{
        padding: '0.625rem 0.75rem',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.5rem',
        backgroundColor: 'var(--background)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--foreground)',
              lineHeight: '1.5',
            }}
          >
            {serviceName}
          </span>
          <DrawerStatusPill status={status} />
        </div>
        <div
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-xs)',
            color: 'var(--muted-foreground)',
            lineHeight: '1.5',
          }}
        >
          {subtitle}
        </div>
      </div>
      <DrawerNavButton
        onClick={onNavigate}
        title={`Vai a ${id} in Gestione Lavorazioni`}
      />
    </div>
  );
}

/**
 * Grid a 2 colonne per coppie chiave/valore (es. area audit/riferimenti).
 */
export function DrawerInfoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.75rem 1.5rem',
      }}
    >
      {children}
    </div>
  );
}

/**
 * Singola cella dentro DrawerInfoGrid.
 */
export function DrawerInfoGridItem({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-xs)',
          color: 'var(--muted-foreground)',
          lineHeight: '1.5',
          marginBottom: '0.125rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-label)',
          fontWeight: 'var(--font-weight-medium)',
          color: valueColor || 'var(--foreground)',
          lineHeight: '1.5',
        }}
      >
        {value || '—'}
      </div>
    </div>
  );
}

/**
 * Barra sottile meta/audit (es. "Ultimo aggiornamento: Admin — 12/03/2026").
 * Da posizionare tra header e body (fuori da DrawerBody).
 */
export function DrawerMetaRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '0.375rem 1.5rem',
        borderBottom: '1px solid var(--border)',
        fontFamily: 'var(--font-inter)',
        fontSize: 'var(--text-xs)',
        color: 'var(--muted-foreground)',
        lineHeight: '1.5',
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Banner di allerta (es. record modificato da un altro admin).
 * Da posizionare tra header e body (fuori da DrawerBody).
 */
export function DrawerAlertBanner({
  children,
  onAction,
  actionLabel,
}: {
  children: React.ReactNode;
  onAction?: () => void;
  actionLabel?: string;
}) {
  return (
    <div
      style={{
        padding: '0.5rem 1.5rem',
        backgroundColor: 'var(--card)',
        borderBottom: '2px solid var(--chart-3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-sm)',
          color: 'var(--chart-3)',
          lineHeight: '1.5',
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
        }}
      >
        {children}
      </span>
      {onAction && actionLabel && (
        <button
          type="button"
          onClick={onAction}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.25rem 0.5rem',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--chart-3)',
            background: 'none',
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--chart-3)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/**
 * Forma dati accademici accettata da DrawerAcademicSnippet.
 * Usa solo tipi primitivi per evitare dipendenze da LavorazioniContext.
 */
export interface AcademicSnippetData {
  thesis_subject?: string | null;
  degree_level?: string | null;
  course_name?: string | null;
  university_name?: string | null;
  thesis_professor?: string | null;
  thesis_type?: string | null;
  foreign_language?: boolean;
  thesis_language?: string | null;
  is_current?: boolean;
}

/**
 * Specchietto dati accademici — pattern read-only condiviso.
 * Sfondo grigio (var(--muted)), icone inline, badge tesi/lingua.
 * Usato in: LavorazioneDetailDrawer, PipelineDetailDrawer,
 *           CreateLavorazioneDrawer, CreatePipelineDrawer (collapsed).
 */
export function DrawerAcademicSnippet({
  record,
  emptyMessage = 'Nessun dato accademico disponibile.',
}: {
  record?: AcademicSnippetData | null;
  emptyMessage?: string;
}) {
  const hasData = record && (
    record.thesis_subject || record.course_name || record.university_name ||
    record.degree_level || record.thesis_professor || record.thesis_type
  );

  return (
    <div
      style={{
        padding: '0.75rem',
        backgroundColor: 'var(--muted)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
      }}
    >
      {!hasData ? (
        <span
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-sm)',
            color: 'var(--muted-foreground)',
            lineHeight: '1.5',
            fontStyle: 'italic',
          }}
        >
          {emptyMessage}
        </span>
      ) : (
        <>
          {/* Materia di tesi */}
          {record!.thesis_subject && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.375rem' }}>
              <BookOpen size={12} style={{ color: 'var(--muted-foreground)', flexShrink: 0, marginTop: '2px' }} />
              <span
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--foreground)',
                  lineHeight: '1.5',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                {record!.thesis_subject}
              </span>
            </div>
          )}

          {/* Livello · Corso · Università */}
          {(record!.degree_level || record!.course_name || record!.university_name) && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.375rem' }}>
              <GraduationCap size={12} style={{ color: 'var(--muted-foreground)', flexShrink: 0, marginTop: '2px' }} />
              <span
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--muted-foreground)',
                  lineHeight: '1.5',
                }}
              >
                {[
                  record!.degree_level ? (DEGREE_LEVEL_MAP[record!.degree_level] || record!.degree_level) : null,
                  record!.course_name || null,
                  record!.university_name || null,
                ].filter(Boolean).join(' · ')}
              </span>
            </div>
          )}

          {/* Relatore */}
          {record!.thesis_professor && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.375rem' }}>
              <User size={12} style={{ color: 'var(--muted-foreground)', flexShrink: 0, marginTop: '2px' }} />
              <span
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--muted-foreground)',
                  lineHeight: '1.5',
                }}
              >
                Relatore: {record!.thesis_professor}
              </span>
            </div>
          )}

          {/* Badge: tipo tesi + lingua */}
          {(record!.thesis_type || (record!.foreign_language && record!.thesis_language)) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                flexWrap: 'wrap',
                marginTop: '0.125rem',
              }}
            >
              {record!.thesis_type && (
                <span
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--muted-foreground)',
                    lineHeight: '1.5',
                    padding: '0.0625rem 0.375rem',
                    borderRadius: 'var(--radius-badge)',
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                  }}
                >
                  {record!.thesis_type === 'compilativa' ? 'Tesi compilativa' : 'Tesi sperimentale'}
                </span>
              )}
              {record!.foreign_language && record!.thesis_language && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--muted-foreground)',
                    lineHeight: '1.5',
                    padding: '0.0625rem 0.375rem',
                    borderRadius: 'var(--radius-badge)',
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                  }}
                >
                  <Globe size={10} />
                  {record!.thesis_language}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── DrawerSearchSelect ────────────────────────────────────────
/**
 * Combobox con ricerca per selezione multipla.
 * Mostra chip per i valori selezionati, input di ricerca con
 * dropdown filtrato. Supporta aggiunta di valori custom ("Aggiungi …").
 */
export function DrawerSearchSelect({
  options,
  selected,
  onSelect,
  onRemove,
  placeholder = 'Cerca o aggiungi...',
}: {
  options: string[];
  selected: string[];
  onSelect: (val: string) => void;
  onRemove: (val: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const queryTrimmed = query.trim();
  const filtered = options.filter(
    o => !selected.includes(o) && o.toLowerCase().includes(queryTrimmed.toLowerCase())
  );
  const showAddNew =
    queryTrimmed.length > 0 &&
    !options.some(o => o.toLowerCase() === queryTrimmed.toLowerCase()) &&
    !selected.some(s => s.toLowerCase() === queryTrimmed.toLowerCase());

  const handleSelect = (val: string) => {
    onSelect(val);
    setQuery('');
    setOpen(false);
  };

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const dropdownVisible = open && (filtered.length > 0 || showAddNew || (queryTrimmed === '' && options.filter(o => !selected.includes(o)).length > 0));

  const dropdownOptions = queryTrimmed === ''
    ? options.filter(o => !selected.includes(o))
    : filtered;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Chip selezionati */}
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.5rem' }}>
          {selected.map(val => (
            <DrawerChip key={val} label={val} onRemove={() => onRemove(val)} />
          ))}
        </div>
      )}

      {/* Input ricerca */}
      <div style={{ position: 'relative' }}>
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: '0.625rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--muted-foreground)',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (dropdownOptions.length > 0) handleSelect(dropdownOptions[0]);
              else if (showAddNew) handleSelect(queryTrimmed);
            }
            if (e.key === 'Escape') { setOpen(false); setQuery(''); }
          }}
          placeholder={placeholder}
          style={{
            padding: '0.5rem 0.625rem 0.5rem 2rem',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-label)',
            fontWeight: 'var(--font-weight-regular)',
            backgroundColor: 'var(--input-background)',
            color: 'var(--foreground)',
            outline: 'none',
            width: '100%',
            lineHeight: '1.5',
            boxSizing: 'border-box' as const,
          }}
        />
      </div>

      {/* Dropdown */}
      {dropdownVisible && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 3px)',
            left: 0,
            right: 0,
            zIndex: 200,
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
            maxHeight: '192px',
            overflowY: 'auto',
          }}
        >
          {dropdownOptions.map(opt => (
            <DropdownItem
              key={opt}
              onMouseDown={e => { e.preventDefault(); handleSelect(opt); }}
            >
              {opt}
            </DropdownItem>
          ))}
          {dropdownOptions.length === 0 && !showAddNew && (
            <div style={{
              padding: '0.625rem 0.75rem',
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              color: 'var(--muted-foreground)',
              lineHeight: '1.5',
            }}>
              Nessun risultato
            </div>
          )}
          {showAddNew && (
            <DropdownItem
              onMouseDown={e => { e.preventDefault(); handleSelect(queryTrimmed); }}
              isPrimary
              hasBorder={dropdownOptions.length > 0}
            >
              <Plus size={12} style={{ flexShrink: 0 }} />
              Aggiungi "{queryTrimmed}"
            </DropdownItem>
          )}
        </div>
      )}
    </div>
  );
}

function DropdownItem({
  children,
  onMouseDown,
  isPrimary,
  hasBorder,
}: {
  children: React.ReactNode;
  onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isPrimary?: boolean;
  hasBorder?: boolean;
}) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      type="button"
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        width: '100%',
        padding: '0.5rem 0.75rem',
        textAlign: 'left',
        background: hovered ? 'var(--muted)' : 'none',
        border: 'none',
        borderTop: hasBorder ? '1px solid var(--border)' : 'none',
        cursor: 'pointer',
        fontFamily: 'var(--font-inter)',
        fontSize: 'var(--text-label)',
        color: isPrimary ? 'var(--primary)' : 'var(--foreground)',
        lineHeight: '1.5',
        transition: 'background 0.1s',
      }}
    >
      {children}
    </button>
  );
}