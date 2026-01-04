import { Chip } from '@mui/material';
import type { JSX } from 'react';
import type { Transaction_Status } from '../../types';

export function TransactionStatusChip({
	status,
}: {
	status: Transaction_Status;
}): JSX.Element {
	switch (status.toUpperCase()) {
		case 'ACTIVE':
			return (
				<Chip
					label="Active"
					color="info"
				/>
			);
		case 'RETURNED':
			return (
				<Chip
					label="Returned"
					color="primary"
				/>
			);
		case 'OVERDUE':
			return (
				<Chip
					label="Overdue"
					color="error"
				/>
			);
		case 'LOST':
			return (
				<Chip
					label="Lost"
					color="success"
				/>
			);
		case 'COMPLETED':
			return (
				<Chip
					label="Completed"
					color="warning"
				/>
			);
		case 'WAITING':
			return (
				<Chip
					label="Waiting"
					color="warning"
				/>
			);
		default:
			return (
				<Chip label="Unknown" />
			);
	}
}
