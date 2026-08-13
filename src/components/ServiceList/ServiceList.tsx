"use client";

import type { Service } from "@/types/database.types";

interface ServiceListProps {
  services: Service[];
  selectedId?: string | null;
  onSelect?: (service: Service) => void;
}

export function ServiceList({ services, selectedId, onSelect }: ServiceListProps) {
  if (services.length === 0) {
    return <p className="empty-state">This shop hasn&apos;t added any services yet.</p>;
  }

  return (
    <ul className="service-list">
      {services.map((service) => (
        <li
          key={service.id}
          className={
            service.id === selectedId
              ? "service-list__item service-list__item--selected"
              : "service-list__item"
          }
        >
          <div>
            <p className="service-list__name">{service.name}</p>
            {service.description && <p className="service-list__desc">{service.description}</p>}
            {Number(service.deposit_amount) > 0 && (
              <p className="service-list__desc">Rs {Number(service.deposit_amount).toFixed(0)} deposit at booking</p>
            )}
          </div>
          <div className="service-list__meta">
            <span className="service-list__duration">{service.duration_minutes} min</span>
            <span className="service-list__price">Rs {Number(service.price).toFixed(0)}</span>
            {onSelect && (
              <button
                type="button"
                className={
                  service.id === selectedId
                    ? "service-list__select service-list__select--active"
                    : "service-list__select"
                }
                onClick={() => onSelect(service)}
              >
                {service.id === selectedId ? "Selected" : "Select"}
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
