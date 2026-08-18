"use client";

import type { Service } from "@/types/database.types";

interface ServiceMultiSelectProps {
  services: Service[];
  selectedIds: string[];
  onToggle: (service: Service) => void;
}

export function ServiceMultiSelect({ services, selectedIds, onToggle }: ServiceMultiSelectProps) {
  if (services.length === 0) {
    return <p className="empty-state">This shop hasn&apos;t added any services yet.</p>;
  }

  const selected = services.filter((s) => selectedIds.includes(s.id));
  const totalPrice = selected.reduce((sum, s) => sum + Number(s.price), 0);
  const totalDuration = selected.reduce((sum, s) => sum + s.duration_minutes, 0);
  const totalDeposit = selected.reduce((sum, s) => sum + Number(s.deposit_amount), 0);

  return (
    <div>
      <div className="service-multi">
        {services.map((service) => {
          const isSelected = selectedIds.includes(service.id);
          return (
            <label
              key={service.id}
              className={isSelected ? "service-multi__item service-multi__item--selected" : "service-multi__item"}
            >
              <input
                type="checkbox"
                className="service-multi__checkbox"
                checked={isSelected}
                onChange={() => onToggle(service)}
              />
              <div className="service-multi__body">
                <p className="service-multi__name">{service.name}</p>
                {service.description && <p className="service-multi__desc">{service.description}</p>}
                {Number(service.deposit_amount) > 0 && (
                  <p className="service-multi__desc">Rs {Number(service.deposit_amount).toFixed(0)} deposit at booking</p>
                )}
              </div>
              <div className="service-multi__meta">
                <span className="service-multi__duration">{service.duration_minutes} min</span>
                <span className="service-multi__price">Rs {Number(service.price).toFixed(0)}</span>
              </div>
            </label>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="service-multi__summary">
          <span>
            {selected.length} service{selected.length === 1 ? "" : "s"} selected · {totalDuration} min total
          </span>
          <span className="service-multi__summary-total">
            Rs {totalPrice.toFixed(0)}
            {totalDeposit > 0 ? ` (Rs ${totalDeposit.toFixed(0)} deposit)` : ""}
          </span>
        </div>
      )}
    </div>
  );
}
