import { Chip } from '@mui/material';
import type { JSX } from 'react';
import type { Transaction_Type } from '../../types';

export function TransactionTypeChip({
	transaction_type,
}: {
	transaction_type: Transaction_Type;
}): JSX.Element {
	switch (transaction_type.toUpperCase()) {
		case 'CHECKOUT':
			return (
				<Chip
					label="Check-Out"
					color="secondary"
				/>
			);
		case 'CHECKIN':
			return (
				<Chip
					label="Check-In"
					color="primary"
				/>
			);
		case 'BALANCE':
			return (
				<Chip
					label="Balance"
					color="error"
				/>
			);
		case 'RENEWAL':
			return (
				<Chip
					label="Renewal"
					color="success"
				/>
			);
		case 'RESERVATION':
			return (
				<Chip
					label="Reservation"
					color="primary"
				/>
			);
		case 'LOST':
			return (
				<Chip
					label="Lost"
					color="error"
				/>
			);
		case 'DAMAGED':
			return (
				<Chip
					label="Damaged"
					color="warning"
				/>
			);
		case 'RESHELVE':
			return (
				<Chip
					label="Reshelve"
					color="success"
				/>
			);
		default:
			return (
				<Chip label="Unknown" />
			);
	}
}
