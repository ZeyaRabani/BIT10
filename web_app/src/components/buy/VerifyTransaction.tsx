import { useState } from 'react';
import { useChain } from '@/context/ChainContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useForm, useStore } from '@tanstack/react-form';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { Field, FieldError, FieldLabel, FieldDescription } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image, { type StaticImageData } from 'next/image';
import ICPImg from '@/assets/wallet/icp-logo.svg';
import BaseImg from '@/assets/wallet/base-logo.svg';
import SolanaImg from '@/assets/wallet/solana-logo.svg';
import BscImg from '@/assets/wallet/bsc-logo.svg';
import { CHAIN_REGISTRY } from '@/chains/chain.registry';

const FormSchema = z.object({
  source_chain: z.string({
    required_error: 'Select a chain'
  }),
  mode: z.string({
    required_error: 'Select a mode'
  }),
  trx_hash: z.string({ required_error: 'Please enter the inbound transaction hash' })
    .min(8, { message: 'Please enter a valid transaction hash' })
});

export default function VerifyTransaction({ mode }: { mode: string }) {
  const [verifying, setVerifying] = useState<boolean>(false);

  const { chain } = useChain();

  const form = useForm({
    defaultValues: {
      source_chain: chain?.toString() ?? 'base',
      mode: mode,
      trx_hash: ''
    },
    validators: {
      onSubmit: FormSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    },
  });

  const formWatchSourceChain = useStore(form.store, (state) => state.values.source_chain)

  async function onSubmit(values: z.infer<typeof FormSchema>) {
    try {
      setVerifying(true);

      if (values.source_chain === 'base') {
        await CHAIN_REGISTRY.base.verifyTransaction({ mode: values.mode, trxHash: values.trx_hash });
      } else if (values.source_chain === 'solana') {
        await CHAIN_REGISTRY.solana.verifyTransaction({ mode: values.mode, trxHash: values.trx_hash });
      } else if (values.source_chain === 'bsc') {
        await CHAIN_REGISTRY.bsc.verifyTransaction({ mode: values.mode, trxHash: values.trx_hash });
      }

      setVerifying(false);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('An error occurred during verification. Please try again!');
    } finally {
      setVerifying(false);
    }
  };

  const verifyDisabledConditions = !chain || formWatchSourceChain === 'icp' || verifying;

  const getVerifyMessage = (): string => {
    if (!chain) return 'Connect wallet to continue';
    if (verifying) return 'Verifying...';
    return 'Verify';
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <p className='pt-2 text-primary underline cursor-pointer'>
          Swap didn&apos;t go through?
        </p>
      </DialogTrigger>
      <DialogContent className='sm:max-w-lg max-w-[90vw] rounded-md'>
        <DialogHeader>
          <DialogTitle>Transaction Verification</DialogTitle>
          <DialogDescription>
            Verify your transaction to recover missing funds.
          </DialogDescription>
        </DialogHeader>
        <form autoComplete='off'
          onSubmit={async (e) => {
            e.preventDefault()
            await form.handleSubmit()
          }}
        >
          <div className='flex flex-col space-y-2'>
            <form.Field name='source_chain'>
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field>
                    <FieldLabel>Source chain</FieldLabel>
                    <Select
                      onValueChange={(value) => field.handleChange(value)}
                      value={field.state.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select a chain' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='icp'>
                          <div className='flex items-center gap-1'>
                            <Image src={ICPImg as StaticImageData} alt='ICP Logo' width={16} height={16} />
                            <span>ICP</span>
                          </div>
                        </SelectItem>
                        <SelectItem value='base'>
                          <div className='flex items-center gap-1'>
                            <Image src={BaseImg as StaticImageData} alt='Base Logo' width={16} height={16} />
                            <span>Base</span>
                          </div>
                        </SelectItem>
                        <SelectItem value='solana'>
                          <div className='flex items-center gap-1'>
                            <Image src={SolanaImg as StaticImageData} alt='Solana Logo' width={16} height={16} />
                            <span>Solana</span>
                          </div>
                        </SelectItem>
                        <SelectItem value='bsc'>
                          <div className='flex items-center gap-1'>
                            <Image src={BscImg as StaticImageData} alt='BSC Logo' width={16} height={16} />
                            <span>Binance Smart Chain</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      Select the chain where the transaction was initiated
                    </FieldDescription>
                    {isInvalid && <FieldError errors={field.state.meta.errors} className='-mt-2.5' />}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name='mode'>
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field>
                    <FieldLabel>Source chain</FieldLabel>
                    <Select onValueChange={field.handleChange} value={field.state.value}>
                      <SelectTrigger>
                        <SelectValue placeholder='Mode' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='mint'>Mint</SelectItem>
                        <SelectItem value='sell'>Sell</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      Select the mode of the transaction
                    </FieldDescription>
                    {isInvalid && <FieldError errors={field.state.meta.errors} className='-mt-2.5' />}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name='trx_hash'>
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field>
                    <FieldLabel>Transaction Hash</FieldLabel>
                    <Input placeholder='Enter transaction hash' onChange={(e) => field.handleChange(e.target.value)} />
                    <FieldDescription>
                      Enter the transaction hash where the funds were taken
                    </FieldDescription>
                    {isInvalid && <FieldError errors={field.state.meta.errors} className='-mt-2.5' />}
                  </Field>
                );
              }}
            </form.Field>
          </div>

          {(formWatchSourceChain === 'icp') && (
            <div className='pt-2 text-sm'>
              To verify funds on the ICP chain, please contact our team at <a href='mailto:harshalraikwar@bit10.app' rel='noopener noreferrer' className='text-primary underline cursor-pointer'>harshalraikwar@bit10.app</a>.
            </div>
          )}

          <DialogFooter className='pt-4'>
            <Button className='w-full' disabled={verifyDisabledConditions}>
              {verifying && <Loader2 className='animate-spin mr-2' size={15} />}
              {getVerifyMessage()}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
