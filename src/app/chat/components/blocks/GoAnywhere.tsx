'use client';
import NavigatePicker from '../../vnext/components/handlers/NavigatePicker';

export type GoAnywhereLink = { label:string; href:string };
export type GoAnywhereProps = { onResolve?:(from:string,to:string)=>void };

export default function GoAnywhere({ onResolve }: GoAnywhereProps) {
  return (
    <div className="rounded-2xl border bg-white p-3">
      <NavigatePicker
        onPickFrom={()=>{}}
        onPickTo={(it)=> onResolve?.('', it.label)}
      />
    </div>
  );
}
